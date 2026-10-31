import confetti from 'canvas-confetti';

/**
 * Elaborate, persistent multi-cannon confetti & fireworks cascade
 * for creating a new celebration or completing major event milestones.
 */
export function triggerGrandCelebration(title?: string) {
  const duration = 3200; // 3.2 seconds persistent fireworks
  const animationEnd = Date.now() + duration;

  // Initial energetic burst from center
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.6 },
    colors: ['#F59E0B', '#D97706', '#DC2626', '#E11D48', '#059669', '#7C3AED', '#FBBF24'],
  });

  // Staggered dual cannon fireworks interval
  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 35 * (timeLeft / duration);

    // Left cannon
    confetti({
      particleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#F59E0B', '#FBBF24', '#DC2626', '#EC4899'],
      zIndex: 9999,
    });

    // Right cannon
    confetti({
      particleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#059669', '#10B981', '#6366F1', '#F59E0B'],
      zIndex: 9999,
    });
  }, 220);
}

/**
 * Sparkle burst for completing high priority or major milestone tasks
 */
export function triggerMilestoneCelebration() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#F59E0B', '#FBBF24'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#EF4444', '#F43F5E'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: ['#10B981', '#059669'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ['#8B5CF6', '#6366F1'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ['#F59E0B', '#D97706'],
  });
}
