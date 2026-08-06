<script lang="ts">
  import { type Snippet } from "svelte";

  type ButtonTypes = "error" | "info";

  const headers: Record<ButtonTypes, string> = {
    error: "Error",
    info: "Info",
  };

  interface Props {
    type?: ButtonTypes;
    header?: string;
    children: Snippet;
  }

  let { type = "info", header, children }: Props = $props();
</script>

<div
  class={[
    "p-2 rounded",
    type == "error" && "bg-red-50 border-red-200 text-red-800",
    type == "info" && "bg-blue-50 border-blue-200 text-blue-900",
  ]}
>
  <h2 class="font-bold mb-1">{header || headers[type]}:</h2>
  <p>{@render children()}</p>
</div>
