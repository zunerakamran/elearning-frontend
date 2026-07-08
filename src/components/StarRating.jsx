export default function StarRating({ rating, onChange, size = 'md', readonly = false }) {
    const sizes = {
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-3xl',
    };

    return (
        <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    className={`transition-transform ${
                        !readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                    }`}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '0 1px',
                        color: star <= rating ? '#f59e0b' : '#d1d5db',
                        fontSize: 'inherit',
                        lineHeight: 1,
                    }}
                >
                    ★
                </button>
            ))}
        </div>
    );
}