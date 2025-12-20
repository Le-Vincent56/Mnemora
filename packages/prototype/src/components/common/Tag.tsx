import './Tag.css';

interface TagProps {
    children: string;
    onClick?: () => void;
}

export function Tag({ children, onClick }: TagProps) {
    return (
        <span
            className={`tag ${onClick ? 'tag--clickable' : ''}`}
            onClick={onClick}
        >
            {children}
        </span>
    );
}