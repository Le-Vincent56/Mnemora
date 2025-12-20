import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import './Button.css';

type ButtonVariant = 'primary' | 'ghost' | 'icon';

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: ButtonVariant;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <motion.button
            className={`button button--${variant} ${className}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            {...props}
        >
            {children}
        </motion.button>
    );
}