# Password Reset Confirmation - Animation & Transition Guide

## Animation Library

All animations defined in [PasswordResetConfirmationPage.css](PasswordResetConfirmationPage.css):

```css
/* Fade in/out */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up with fade */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);  /* Start 20px below */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide down with fade */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);  /* Start 20px above */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide from left with fade */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);  /* Start 30px to the left */
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Slide from right with fade */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);  /* Start 30px to the right */
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Scale up with fade (smooth pop) */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);  /* Start 5% smaller */
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulsing glow effect */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 85, 64, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(255, 85, 64, 0.5);  /* Brighter in middle */
  }
}

/* Opacity pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }  /* Dips to 70% opacity */
}

/* Shimmer (background slide) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }  /* Slides left to right */
}

/* Scale pulse (breathing effect) */
@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }  /* Grows 5% */
  100% { transform: scale(1); }
}
```

## Element Entrance Timeline

### Page Load Sequence
```
Time:      0ms          100ms         200ms         250ms         300ms
           |             |             |             |             |
Back Btn   •—————[slideInDown]———→
Success    
Icon              •—————[scaleIn+bounce]———→
Heading                  •—————[slideInUp]———→
Info Box                       •—————[slideInUp]———→
Actions                             •—————[slideInUp]———→
Helpful Tip                              •—————[slideInUp]———→
Footer                                    •—————[slideInUp]———→
           
Total Duration: ~0.45s + animation duration (0.4s) = ~0.85s complete entrance
```

## Hover & Interactive Effects

### Primary Button (BACK TO LOGIN)
```
Normal State:
  - Background: linear-gradient(90deg, #ff5540, #ffffff)
  - Shadow: 0 4px 15px rgba(255,85,64,0.3)
  - Transform: translateY(0)

Hover State:
  - Shadow: 0 8px 25px rgba(255,85,64,0.4)  ← Enhanced
  - Transform: translateY(-2px)              ← Lifts up
  - Transition: all 0.3s ease

Active State:
  - Transform: translateY(0)                 ← Returns to normal
  - Transition: all 0.3s ease

Disabled State:
  - Opacity: 0.6
  - Cursor: not-allowed
```

### Footer Links (RESEND LINK, CONTACT SUPPORT)
```
Normal:
  - Color: #b18780
  - Transition: all 0.3s ease

Hover:
  - Color: #ff5540  ← Changes to primary
  - Transition: all 0.3s ease

Disabled:
  - Opacity: 0.6
  - Cursor: not-allowed
```

### Back Button
```
Normal:
  - Color: #ebbbb4
  - Position: translateX(0)

Hover:
  - Color: #ff5540  ← Changes to primary
  - Position: translateX(-4px)  ← Moves left slightly
  - Icon also moves: translateX(-2px)
```

## Transition Variables

**Defined in CSS Root:**
```css
--transition-fast:   0.15s ease           /* Quick feedback */
--transition-base:   0.2s ease            /* Standard */
--transition-normal: 0.3s ease            /* Most interactive */
--transition-smooth: 0.4s cubic-bezier(0.4, 0, 0.2, 1)  /* Entrance */
--transition-bounce: 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)  /* Success icon */
```

## Color Transitions

### Text Links
```css
transition: color var(--transition-normal) ease;

/* Example */
color: var(--color-outline);           /* Normal */
color: var(--color-primary-container); /* Hover */
```

### Transform Effects
```css
transition: transform var(--transition-normal) ease;

/* Example - Back button */
transform: translateX(0);    /* Normal */
transform: translateX(-4px); /* Hover */
```

## Layout Animations

### Hero Section Entrance
```css
.password-reset-confirmation-hero-image {
  animation: slideInLeft var(--transition-smooth) ease;
}

Moves from:  translateX(-30px) opacity(0)
Moves to:    translateX(0) opacity(1)
Duration:    0.4s
```

### Success Indicator Pop
```css
.password-reset-confirmation-success-indicator {
  animation: scaleIn var(--transition-bounce) ease;
  animation-delay: 0.2s;
}

Timing function: cubic-bezier(0.34, 1.56, 0.64, 1) ← Bounce!
Creates springy, playful feel
```

## Performance Optimization

All animations use GPU-accelerated properties:
- ✅ `transform` (2D/3D transforms)
- ✅ `opacity` (fade effects)
- ❌ Avoid animating: width, height, position, etc.

This ensures smooth 60fps playback on most devices.

## Responsive Animation Adjustments

**Mobile (< 480px):**
- All animations maintained at same duration
- Delays slightly reduced for faster perceived load
- No desktop-specific animations (hero)

**Tablet (481px - 767px):**
- Hero section still hidden
- Standard animation timing maintained

**Desktop (768px+):**
- Hero image slides in from left
- Full animation timeline
- Interactive hover effects enhanced

## Browser Rendering

### Paint & Composite Layers
- Hero image: Separate layer (will-change: implicit)
- Animations don't trigger layout recalc
- Only use transform & opacity (no reflow)

### Frame Timing (60fps target)
```
Frame @ 60fps = 16.67ms per frame
0.3s transition = ~18 frames
0.4s entrance = ~24 frames
Smooth visual result with proper easing
```

## CSS Easing Functions

**Linear** (rarely used)
- `ease-in`: Slow start, fast end
- `ease-out`: Fast start, slow end
- `ease-in-out`: Smooth S-curve

**Used in Animations:**
- `ease`: Default smooth transition
- `cubic-bezier(0.4, 0, 0.2, 1)`: Material Design smooth
- `cubic-bezier(0.34, 1.56, 0.64, 1)`: Bouncy springy feel

## Testing Animations

### Chrome DevTools
1. Open DevTools (F12)
2. Go to Animations tab
3. Interact with page elements
4. Watch timeline of animations
5. Slow down to 25% speed to observe effects

### Animation Checklist
- [ ] All elements fade in smoothly
- [ ] No jank or stuttering
- [ ] Delays create nice sequence
- [ ] Hover effects responsive
- [ ] Mobile animations smooth on low-end devices
- [ ] Success icon bounce feels satisfying
- [ ] Button lift effect provides feedback
- [ ] Links highlight on hover
- [ ] Transitions feel natural (not too fast/slow)

## Custom Animation Recipes

### Success Icon with Glow
```css
.password-reset-confirmation-success-indicator {
  animation: scaleIn var(--transition-bounce) ease;
  animation-delay: 0.2s;
  box-shadow: 0 0 30px rgba(255, 85, 64, 0.3);
}
```
Result: Icon pops in with a satisfying bounce and glows

### Staggered List Entrance
```css
element {
  animation: slideInUp var(--transition-smooth) ease;
  animation-delay: calc(0.1s * var(--item-index));
}
```
Result: Items appear one after another smoothly

### Button Press Effect
```css
button {
  transition: all var(--transition-normal) ease;
}
button:active {
  transform: scale(0.98);  /* Tiny shrink */
}
```
Result: Tactile feedback on click

## Common Animation Timing

| Duration | Use Case | Feel |
|----------|----------|------|
| 0.15s | Micro-interactions | Snappy, responsive |
| 0.2s | Standard changes | Quick, natural |
| 0.3s | Hover effects | Smooth, readable |
| 0.4s | Entrances | Graceful, elegant |

## Debugging

If animations don't play:
1. Check `animation-name` matches keyframe
2. Verify `animation-duration` is set
3. Ensure element has `display: block/flex` (not `display: none`)
4. Check `visibility` not set to `hidden`
5. Look for conflicting `transition` properties
