import { Toaster as Sonner, toast } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#2D3A3A] group-[.toaster]:border-[#EBEBE8] group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-[#5C6B6B]",
          actionButton:
            "group-[.toast]:bg-[#4A6C6F] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#F2F4F0] group-[.toast]:text-[#5C6B6B]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast }
