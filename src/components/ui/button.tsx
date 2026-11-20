import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,border-color,transform,opacity] duration-200 ease-out active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-graphite",
        inverse: "bg-paper text-ink hover:bg-concrete",
        outline: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
        "outline-inverse": "border border-paper/70 bg-transparent text-paper hover:bg-paper hover:text-ink",
        ghost: "bg-transparent text-ink hover:bg-concrete",
        subtle: "bg-concrete text-ink hover:bg-stone",
        danger: "bg-danger text-paper hover:bg-danger/90",
        link: "h-auto px-0 text-ink underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-[13px]",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-8 text-[15px] tracking-wide",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot.Root : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
            <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>{children}</span>
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}

export { buttonVariants };
