<script lang="ts">
  import { type Snippet } from "svelte";
  import { type UIEventHandler } from "svelte/elements";
  import { type LucideIcon } from "@lucide/svelte";

  type ButtonType = "primary" | "error";

  const variants: Record<ButtonType, string[]> = {
    primary: [
      "bg-orange-500",
      "text-white",
      "hover:bg-orange-600",
      "active:bg-orange-700",
    ],
    error: [
      "bg-red-500",
      "text-white",
      "hover:bg-red-600",
      "active:bg-red-700",
    ],
  };

  interface Props {
    onclick?: UIEventHandler<HTMLButtonElement>;
    type?: ButtonType;
    disabled?: boolean;
    icon?: LucideIcon;
    iconSpin?: boolean;
    children?: Snippet;
  }

  let {
    type = "primary",
    onclick = () => {},
    disabled,
    icon,
    iconSpin,
    children,
  }: Props = $props();
</script>

<button
  {onclick}
  {disabled}
  class={[
    "flex gap-2 px-4 py-2 rounded-full cursor-pointer transition-all font-semibold",
    ...variants[type],
  ]}
>
  <span class="flex gap-2">
    {#if icon}
      {@const Icon = icon}
      <Icon size="1.1rem" class={[iconSpin && "animate-spin"]} />
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </span>
</button>
