"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// design-tokens §6.5 Tabs (Segmented)
//   container: padding 3px / bg --bg / radius 10px
//   tab: height 30px / radius 8px / font 12-700 / color ink-3
//   tab.active: bg surface / color ink / shadow-sm
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  // Base UI는 useRenderElement에서 user의 data-* props를 swallow하므로
  // group/tabs 컨테이너를 wrapping div로 만들어 data-orientation 을 직접 부여한다.
  return (
    <div
      data-orientation={orientation}
      className={cn(
        "group/tabs flex flex-col gap-s-2 data-vertical:flex-row",
        className,
      )}
    >
      <TabsPrimitive.Root
        data-slot="tabs"
        orientation={orientation}
        {...props}
      />
    </div>
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center gap-1 p-[3px] text-ink-3 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-bg rounded-lg",
        line: "bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 text-caption font-bold whitespace-nowrap text-ink-3 transition-all duration-180",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "hover:text-ink",
        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
        // segmented (default)
        "group-data-[variant=default]/tabs-list:data-active:bg-surface group-data-[variant=default]/tabs-list:data-active:text-ink group-data-[variant=default]/tabs-list:data-active:shadow-sm",
        // line variant — bottom indicator
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:px-2 group-data-[variant=line]/tabs-list:bg-transparent",
        "after:absolute after:bg-primary after:opacity-0 after:transition-opacity",
        "group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5",
        "group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5",
        "group-data-[variant=line]/tabs-list:data-active:text-ink group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-body outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
