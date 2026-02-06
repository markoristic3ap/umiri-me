import { motion } from "framer-motion";
import {
  Briefcase, Moon, Dumbbell, Users, UtensilsCrossed, Home,
  HeartPulse, Cloud, Wallet, BookOpen, Palmtree, Palette
} from "lucide-react";

const ICON_MAP = {
  Briefcase, Moon, Dumbbell, Users, UtensilsCrossed, Home,
  HeartPulse, Cloud, Wallet, BookOpen, Palmtree, Palette
};

const TRIGGERS = [
  { id: "posao", label: "Posao", icon: "Briefcase", color: "#4A6C6F" },
  { id: "san", label: "San", icon: "Moon", color: "#7CA5B8" },
  { id: "vezba", label: "Vežbanje", icon: "Dumbbell", color: "#769F78" },
  { id: "drustvo", label: "Društvo", icon: "Users", color: "#E8C170" },
  { id: "ishrana", label: "Ishrana", icon: "UtensilsCrossed", color: "#E09F7D" },
  { id: "porodica", label: "Porodica", icon: "Home", color: "#B8A07C" },
  { id: "zdravlje", label: "Zdravlje", icon: "HeartPulse", color: "#D66A6A" },
  { id: "vreme", label: "Vreme", icon: "Cloud", color: "#8A9999" },
  { id: "novac", label: "Novac", icon: "Wallet", color: "#769F78" },
  { id: "ucenje", label: "Učenje", icon: "BookOpen", color: "#7CA5B8" },
  { id: "odmor", label: "Odmor", icon: "Palmtree", color: "#769F78" },
  { id: "kreativnost", label: "Kreativnost", icon: "Palette", color: "#E8C170" },
];

export default function TriggerSelector({ selected = [], onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TRIGGERS.map((trigger, i) => {
        const isSelected = selected.includes(trigger.id);
        const IconComponent = ICON_MAP[trigger.icon];
        return (
          <motion.button
            key={trigger.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            data-testid={`trigger-${trigger.id}`}
            onClick={() => toggle(trigger.id)}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              isSelected
                ? "text-white shadow-md scale-105"
                : "bg-white text-[#5C6B6B] border border-[#EBEBE8] hover:border-[#D6E0D6] hover:bg-[#F2F4F0]"
            }`}
            style={isSelected ? { backgroundColor: trigger.color } : {}}
          >
            {IconComponent && <IconComponent className="w-3.5 h-3.5" strokeWidth={1.5} />}
            {trigger.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export { TRIGGERS };
