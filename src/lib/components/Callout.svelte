<script lang="ts">
  import { type Snippet } from "svelte";

  export type CalloutType = "error" | "info" | "success";

  const headers: Record<CalloutType, string> = {
    error: "Error",
    info: "Info",
    success: "Success",
  };

  export interface CalloutProps {
    type?: CalloutType;
    header?: string;
    message: string;
  }

  let { type = "info", header, message }: CalloutProps = $props();
</script>

<div
  class={[
    "p-2 rounded transition-colors",
    type == "error" && "bg-red-50 border-red-200 text-red-800",
    type == "info" && "bg-blue-50 border-blue-200 text-blue-900",
    type == "success" && "bg-green-50 border-green-200 text-green-900",
  ]}
>
  <h2 class="font-bold mb-1">{header || headers[type]}:</h2>
  <p>{message}</p>
</div>
