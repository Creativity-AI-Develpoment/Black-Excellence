import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
import uvicorn
import stripe

from app.db.database import Base, engine, get_db
from app.db.seed_catalog import seed_catalog
from app.models.user import User
from app.models.catalog import HistoricalFigure as HistoricalFigureDB
from app.models.catalog import HistoricalEvent as HistoricalEventDB
from app.models.catalog import Product as ProductDB
from app.models.commerce import CartItem, Order, OrderItem

app = FastAPI(
    title="Black Excellence History API",
    description="API for historical Black Excellence figures and events",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Initialize OpenAI client only if API key is provided
ai_client = None
if NVIDIA_API_KEY and NVIDIA_API_KEY != "placeholder_nvidia_api_key":
    ai_client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )

Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    seed_catalog(db)
    db.close()


class HistoricalFigure(BaseModel):
    id: int
    name: str
    birth_year: int
    death_year: Optional[int] = None
    profession: str
    achievements: List[str]
    biography: str
    image_url: Optional[str] = None
    category: str
    model_config = ConfigDict(from_attributes=True)


class HistoricalEvent(BaseModel):
    id: int
    title: str
    year: int
    description: str
    significance: str
    location: str
    key_figures: List[str]
    model_config = ConfigDict(from_attributes=True)


class ChatRequest(BaseModel):
    message: str
    temperature: float = 0.2
    top_p: float = 0.7
    max_tokens: int = 512
    thinking: bool = True


class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class UserPublic(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    subscription_tier: str


class SubscriptionPlan(BaseModel):
    id: int
    name: str
    price: float
    interval: str
    description: str
    features: List[str]
    stripe_price_id: Optional[str] = None


class Product(BaseModel):
    id: int
    name: str
    description: str
    price: float
    category: str
    seller_id: Optional[int] = None
    image_urls: List[str] = []
    tags: List[str] = []
    is_active: bool = True
    stock_quantity: int = 0
    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: Product
    subtotal: float


class OrderItemResponse(BaseModel):
    product: Product
    quantity: int
    unit_price: float
    subtotal: float


class OrderResponse(BaseModel):
    id: int
    status: str
    total_amount: float
    created_at: datetime
    items: List[OrderItemResponse]


class CartAddRequest(BaseModel):
    product_id: int
    quantity: int = 1


class CartUpdateRequest(BaseModel):
    quantity: int


PLANS: List[Dict] = [
    {
        "id": 1,
        "name": "Free",
        "price": 0.0,
        "interval": "month",
        "description": "Explore curated figures and events.",
        "features": ["Browse figures", "Browse events", "Ask the Historian (rate-limited)"],
        "stripe_price_id": None,
    },
    {
        "id": 2,
        "name": "Basic",
        "price": 9.99,
        "interval": "month",
        "description": "Unlock more content and marketplace access.",
        "features": ["Everything in Free", "Marketplace purchases", "Higher AI limits"],
        "stripe_price_id": os.getenv("STRIPE_BASIC_PRICE_ID"),
    },
    {
        "id": 3,
        "name": "Premium",
        "price": 19.99,
        "interval": "month",
        "description": "Creator tools and exclusive events.",
        "features": ["Everything in Basic", "Creator tools", "Exclusive events", "Priority support"],
        "stripe_price_id": os.getenv("STRIPE_PREMIUM_PRICE_ID"),
    },
]


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.get("/")
def read_root():
    return {"message": "Black Excellence History API", "version": "1.0.0"}


@app.get("/api/figures", response_model=List[HistoricalFigure])
def get_figures(db: Session = Depends(get_db)):
    return db.query(HistoricalFigureDB).all()


@app.get("/api/figures/{figure_id}", response_model=HistoricalFigure)
def get_figure(figure_id: int, db: Session = Depends(get_db)):
    figure = db.query(HistoricalFigureDB).filter(HistoricalFigureDB.id == figure_id).first()
    if not figure:
        raise HTTPException(status_code=404, detail="Figure not found")
    return figure


@app.get("/api/events", response_model=List[HistoricalEvent])
def get_events(db: Session = Depends(get_db)):
    return db.query(HistoricalEventDB).all()


@app.get("/api/events/{event_id}", response_model=HistoricalEvent)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(HistoricalEventDB).filter(HistoricalEventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(HistoricalFigureDB.category).distinct().all()
    categories_flat = [c[0] for c in categories if c[0]]
    return {"categories": categories_flat}


@app.post("/api/ai/chat")
def chat_with_ai(payload: ChatRequest):
    if not NVIDIA_API_KEY or not ai_client:
        raise HTTPException(status_code=500, detail="NVIDIA_API_KEY is not configured on the server.")

    try:
        completion = ai_client.chat.completions.create(
            model="deepseek-ai/deepseek-v3.1",
            messages=[{"role": "user", "content": payload.message}],
            temperature=payload.temperature,
            top_p=payload.top_p,
            max_tokens=payload.max_tokens,
            extra_body={"chat_template_kwargs": {"thinking": payload.thinking}},
        )
        content = completion.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI request failed: {exc}")

    return {"response": content}


@app.post("/api/auth/register")
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == payload.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_username = db.query(User).filter(User.username == payload.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = pwd_context.hash(payload.password)
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=hashed_password,
        full_name=payload.full_name,
        subscription_tier="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/auth/login")
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "subscription_tier": current_user.subscription_tier or "free",
    }


@app.get("/api/marketplace/products", response_model=List[Product])
def list_products(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProductDB).filter(ProductDB.is_active == True)
    if category:
        query = query.filter(ProductDB.category.ilike(category))
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            ProductDB.name.ilike(term) | ProductDB.description.ilike(term)
        )
    return query.all()


@app.get("/api/marketplace/products/{product_id}", response_model=Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(ProductDB)
        .filter(ProductDB.id == product_id, ProductDB.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.post("/api/marketplace/products/{product_id}/purchase")
def purchase_product(product_id: int, current_user: Dict = Depends(get_current_user), db: Session = Depends(get_db)):
    product = (
        db.query(ProductDB)
        .filter(ProductDB.id == product_id, ProductDB.is_active == True)
        .with_for_update()
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock_quantity <= 0:
        raise HTTPException(status_code=400, detail="Out of stock")

    product.stock_quantity -= 1
    db.commit()
    db.refresh(product)
    return {"message": "Order created", "remaining_stock": product.stock_quantity}


@app.get("/api/subscriptions/plans", response_model=List[SubscriptionPlan])
def list_plans():
    return PLANS


@app.post("/api/subscriptions/select")
def select_plan(plan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = next((p for p in PLANS if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.subscription_tier = plan["name"].lower()
    db.commit()
    db.refresh(user)
    return {"message": "Plan selected", "plan": plan}


@app.get("/api/marketplace/categories")
def get_marketplace_categories(db: Session = Depends(get_db)):
    categories = db.query(ProductDB.category).filter(ProductDB.is_active == True).distinct().all()
    categories_flat = [c[0] for c in categories if c[0]]
    return {"categories": categories_flat}


@app.get("/api/cart", response_model=List[CartItemResponse])
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    result: List[CartItemResponse] = []
    for item in items:
        subtotal = (item.product.price or 0) * item.quantity
        result.append(
            CartItemResponse(
                id=item.id,
                quantity=item.quantity,
                product=item.product,
                subtotal=subtotal,
            )
        )
    return result


@app.post("/api/cart", response_model=CartItemResponse)
def add_to_cart(
    payload: Optional[CartAddRequest] = None,
    product_id: Optional[int] = None,
    quantity: int = 1,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Support both JSON body and query params for backward compatibility
    if payload:
        product_id = payload.product_id
        quantity = payload.quantity
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

    product = (
        db.query(ProductDB)
        .filter(ProductDB.id == product_id, ProductDB.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or inactive")
    if product.stock_quantity < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {product.stock_quantity} items available in stock",
        )

    cart_item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == product_id)
        .first()
    )
    if cart_item:
        new_quantity = cart_item.quantity + quantity
        if product.stock_quantity < new_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product.stock_quantity} items available in stock",
            )
        cart_item.quantity = new_quantity
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=product_id,
            quantity=quantity,
        )
        db.add(cart_item)
    db.commit()
    db.refresh(cart_item)

    subtotal = (cart_item.product.price or 0) * cart_item.quantity
    return CartItemResponse(
        id=cart_item.id,
        quantity=cart_item.quantity,
        product=cart_item.product,
        subtotal=subtotal,
    )


@app.put("/api/cart/{item_id}", response_model=CartItemResponse)
def update_cart_item(
    item_id: int,
    payload: Optional[CartUpdateRequest] = None,
    quantity: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload:
        quantity = payload.quantity
    if quantity is None:
        raise HTTPException(status_code=400, detail="Quantity is required")

    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if quantity <= 0:
        db.delete(cart_item)
        db.commit()
        raise HTTPException(status_code=200, detail="Item removed")

    if cart_item.product.stock_quantity < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Only {cart_item.product.stock_quantity} items available in stock",
        )

    cart_item.quantity = quantity
    db.commit()
    db.refresh(cart_item)
    subtotal = (cart_item.product.price or 0) * cart_item.quantity
    return CartItemResponse(
        id=cart_item.id,
        quantity=cart_item.quantity,
        product=cart_item.product,
        subtotal=subtotal,
    )


@app.delete("/api/cart/{item_id}")
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(cart_item)
    db.commit()
    return {"message": "Item removed"}


@app.post("/api/orders", response_model=OrderResponse)
def create_order(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = 0.0
    for item in cart_items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {item.product.name}",
            )

    order = Order(user_id=current_user.id, status="pending", total_amount=0.0)
    db.add(order)
    db.flush()  # get order.id

    order_items: List[OrderItem] = []
    for item in cart_items:
        subtotal = (item.product.price or 0) * item.quantity
        total += subtotal
        oi = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price or 0,
            subtotal=subtotal,
        )
        order_items.append(oi)
        item.product.stock_quantity -= item.quantity
        db.add(oi)

    order.total_amount = total
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    db.refresh(order)

    items_response = [
        OrderItemResponse(
            product=oi.product,
            quantity=oi.quantity,
            unit_price=oi.unit_price,
            subtotal=oi.subtotal,
        )
        for oi in order_items
    ]

    return OrderResponse(
        id=order.id,
        status=order.status,
        total_amount=order.total_amount,
        created_at=order.created_at,
        items=items_response,
    )


@app.post("/api/checkout/session")
def create_checkout_session(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")

    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Validate stock and compute total
    total = 0.0
    line_items = []
    for item in cart_items:
        if item.product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {item.product.name}",
            )
        subtotal = (item.product.price or 0) * item.quantity
        total += subtotal
        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": item.product.name,
                        "description": item.product.description or "",
                    },
                    "unit_amount": int((item.product.price or 0) * 100),
                },
                "quantity": item.quantity,
            }
        )

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            line_items=line_items,
            success_url=f"{FRONTEND_URL}?checkout=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}?checkout=cancelled",
            customer_email=current_user.email,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Stripe session error: {exc}")

    # Create order with pending status tied to session
    order = Order(
        user_id=current_user.id,
        status="pending",
        total_amount=total,
        stripe_checkout_session_id=session.id,
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        subtotal = (item.product.price or 0) * item.quantity
        oi = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.product.price or 0,
            subtotal=subtotal,
        )
        db.add(oi)

    # Do NOT clear cart here; clear on successful payment webhook
    db.commit()
    db.refresh(order)

    return {"checkout_url": session.url, "session_id": session.id}


@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured.")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Webhook error: {exc}")

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        session_id = session_obj.get("id")
        payment_intent = session_obj.get("payment_intent")

        order = (
            db.query(Order)
            .filter(Order.stripe_checkout_session_id == session_id)
            .first()
        )
        if order and order.status != "completed":
            order.status = "completed"
            order.stripe_payment_intent_id = payment_intent

            # decrement stock for each order item
            for oi in order.items:
                product = db.query(ProductDB).filter(ProductDB.id == oi.product_id).first()
                if product:
                    product.stock_quantity = max(product.stock_quantity - oi.quantity, 0)

            # clear cart for user
            db.query(CartItem).filter(CartItem.user_id == order.user_id).delete()
            db.commit()

    return {"status": "ok"}


@app.get("/api/orders", response_model=List[OrderResponse])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    results: List[OrderResponse] = []
    for order in orders:
        items_resp = [
            OrderItemResponse(
                product=oi.product,
                quantity=oi.quantity,
                unit_price=oi.unit_price,
                subtotal=oi.subtotal,
            )
            for oi in order.items
        ]
        results.append(
            OrderResponse(
                id=order.id,
                status=order.status,
                total_amount=order.total_amount,
                created_at=order.created_at,
                items=items_resp,
            )
        )
    return results


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
