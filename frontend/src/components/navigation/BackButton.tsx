"use client";

import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href?: string;
  label?: string;
}

/**
 * BackButton Component
 * 
 * Provides a back navigation button with consistent styling.
 * Based on COSS comp-85.
 * 
 * @param href - Optional href to navigate to (default: /dashboard)
 * @param label - Optional label text (default: "Back to Dashboard")
 */
export function BackButton({ href = "/dashboard", label = "Back to Dashboard" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
  };

  return (
    <Button 
      className="group" 
      variant="ghost"
      onClick={handleClick}
      size="sm"
    >
      <ArrowLeftIcon
        className="-ms-1 opacity-60 transition-transform group-hover:-translate-x-0.5"
        size={16}
        aria-hidden="true"
      />
      {label}
    </Button>
  );
}

export default BackButton;

