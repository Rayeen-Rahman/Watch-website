import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Success = () => {
  const { clearCart } = useCart();
  
  useEffect(() => {
    // Clear the cart exactly when they hit this success page!
    if (clearCart) clearCart();
  }, [clearCart]);

  return (
    <div style={{minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px'}}>
      <CheckCircle size={80} color="var(--store-success, #22C55E)" style={{marginBottom: '30px'}} />
      <h1 style={{fontSize: '3rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '20px', textAlign: 'center'}}>Order placed successfully!</h1>
      <p style={{fontSize: '1.2rem', color: 'var(--store-text-light)', marginBottom: '40px', textAlign: 'center'}}>
        Your premium timepiece is being prepared for Cash on Delivery. 
      </p>
      <Link to="/" style={{backgroundColor: 'var(--store-accent)', color: 'white', padding: '16px 35px', borderRadius: '50px', textDecoration: 'none', fontWeight: 600, transition: 'transform 0.2s'}}>
        CONTINUE SHOPPING
      </Link>
    </div>
  );
};

export default Success;
