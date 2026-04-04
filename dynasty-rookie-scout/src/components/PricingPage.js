import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiFetch from '../services/apiClient';

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PricingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/subscriptions/plans')
      .then(data => setPlans(data.plans || []))
      .catch(() => {});

    if (user) {
      apiFetch('/api/subscriptions/status')
        .then(data => setCurrentTier(data.tier || 'free'))
        .catch(() => {});
    }
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch('/api/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId: 'pro' }),
      });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      // Stripe not configured yet
      alert('Payments coming soon! Check back later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36,
          fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8,
        }}>
          Choose Your Plan
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif", fontSize: 15,
          color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto',
        }}>
          Free access to all prospects and community discussions.
          Upgrade for advanced features and unlimited boards.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {plans.map(plan => {
          const isCurrent = plan.id === currentTier;
          const isPro = plan.id === 'pro';

          return (
            <div key={plan.id} style={{
              background: 'var(--bg-card)',
              border: `2px solid ${isPro ? 'var(--accent)' : 'var(--border-primary)'}`,
              borderRadius: 16,
              padding: '28px 24px',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {isPro && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent)', color: '#fff',
                  padding: '4px 16px', borderRadius: 12,
                  fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  Popular
                </div>
              )}

              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 24,
                fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4,
              }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: 20 }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40,
                  fontWeight: 800, color: 'var(--text-primary)',
                }}>
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.interval && (
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 14,
                    color: 'var(--text-tertiary)', marginLeft: 4,
                  }}>
                    /{plan.interval}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, marginBottom: 24 }}>
                {(plan.features || []).map((feature, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 0',
                    fontFamily: "'Inter', sans-serif", fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}>
                    <span style={{ color: isPro ? 'var(--accent)' : 'var(--success)', flexShrink: 0 }}>
                      <CheckIcon />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              {isCurrent ? (
                <div style={{
                  padding: '12px', borderRadius: 10, textAlign: 'center',
                  background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)',
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600,
                }}>
                  Current Plan
                </div>
              ) : isPro ? (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  style={{
                    padding: '14px', borderRadius: 10, border: 'none',
                    background: 'var(--accent)', color: '#fff',
                    fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '14px', borderRadius: 10,
                    border: '1px solid var(--border-primary)',
                    background: 'transparent', color: 'var(--text-primary)',
                    fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Get Started
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingPage;
