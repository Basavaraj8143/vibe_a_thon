import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export default function useShake(onShake: () => void, enabled: boolean = true) {
    const lastShakeRef = useRef(0);

    useEffect(() => {
        if (!enabled) return;

        // Faster update interval to catch sharp shakes
        Accelerometer.setUpdateInterval(50);

        const subscription = Accelerometer.addListener(({ x, y, z }) => {
            const totalForce = Math.sqrt(x * x + y * y + z * z);

            // Debug: Log force if it's somewhat high
            if (totalForce > 1.5) {
                console.log('Current G-Force:', totalForce.toFixed(2));
            }

            // Threshold: 2.0g (Lowered from 2.5g, but higher than default 1.78g)
            if (totalForce > 2.0) {
                const now = Date.now();
                // Debounce: 1 second
                if (now - lastShakeRef.current > 1000) {
                    lastShakeRef.current = now;
                    console.log('>>> SHAKE TRIGGERED! <<<');
                    onShake();
                }
            }
        });

        return () => {
            subscription && subscription.remove();
        };
    }, [enabled, onShake]);
}
