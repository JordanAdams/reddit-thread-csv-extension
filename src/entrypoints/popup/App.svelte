<script lang="ts">
  import Callout from "@/lib/components/Callout.svelte";
  import DownloadButton from "@/lib/components/DownloadButton.svelte";
  import { currentTabTitle, currentTabUrl } from "@/lib/stores/tab";
  import { type ComponentProps } from "svelte";
  import { fade } from "svelte/transition";

  let isRedditThread = $derived.by(
    (): boolean =>
      $currentTabUrl !== null &&
      $currentTabUrl.hostname.match(/(?:www\.)?reddit.com/) !== null &&
      $currentTabUrl.pathname.match(/\/r\/[^\/]+\/comments/) !== null,
  );

  let downloadedFile = $state<string>("");
  let downloadError = $state<Error | null>(null);

  const onDownloadClick = () => {
    downloadedFile = "";
    downloadError = null;
  };

  const onDownloadSuccess = (file: string) => {
    console.log("ON DOWNLOAD SUCCESS", file);
    downloadedFile = file;
  };
  const onDownloadError = (err: Error) => {
    downloadError = err;
  };

  let error = $derived.by((): string | null => {
    if (!$currentTabUrl) {
      return "Failed to access current tab.";
    }

    if (!isRedditThread) {
      return "Current tab is not a Reddit thread.";
    }

    if (downloadError) {
      return `Download Failed: ${downloadError.message}`;
    }

    return null;
  });

  let calloutProps = $derived.by<ComponentProps<typeof Callout> | null>(() => {
    if (error) {
      return {
        type: "error",
        message: error,
      };
    }

    if (downloadedFile.length > 0) {
      return {
        type: "success",
        header: "Downloaded File",
        message: downloadedFile,
      };
    }

    if (isRedditThread) {
      return {
        type: "info",
        header: "Thread Found",
        message: $currentTabTitle || "",
      };
    }

    return null;
  });
</script>

<div class="p-4 flex flex-col gap-4">
  <h1 class="text-xl font-semibold">Reddit CSV Exporter</h1>

  {#if calloutProps}
    <div transition:fade>
      <Callout {...calloutProps} />
    </div>
  {/if}

  {#if $currentTabUrl && isRedditThread}
    <div class="flex justify-end">
      <DownloadButton
        threadURL={$currentTabUrl.toString()}
        onClick={onDownloadClick}
        onError={onDownloadError}
        onSuccess={onDownloadSuccess}
      />
    </div>
  {/if}
</div>
