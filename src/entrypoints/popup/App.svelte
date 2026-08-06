<script lang="ts">
  import { browser } from "wxt/browser";
  import { FileDown, LoaderCircle } from "@lucide/svelte";
  import Callout from "@/lib/components/Callout.svelte";
  import Button from "@/lib/components/Button.svelte";
  import { fetchThread } from "@/lib/reddit";

  const DOWNLOAD_STATE = {
    READY: "DOWNLOAD_READY",
    IN_PROGRESS: "DOWNLOAD_IN_PROGRESS",
    ERROR: "DOWNLOAD_ERROR",
    SUCCESS: "DOWNLOAD_SUCCESS",
  } as const;

  type DownloadState = (typeof DOWNLOAD_STATE)[keyof typeof DOWNLOAD_STATE];

  let currentDownloadState: DownloadState = $state<DownloadState>(
    DOWNLOAD_STATE.READY,
  );

  let currentTab = $state<Browser.tabs.Tab | null>(null);

  let isRedditThread = $derived.by((): boolean => {
    if (!currentTab || !currentTab.url) {
      return false;
    }

    const url = URL.parse(currentTab.url);

    if (
      !url ||
      !url.hostname.match(/(?:www\.)?reddit.com/) ||
      !url.pathname.match(/\/r\/[^\/]+\/comments/)
    ) {
      return false;
    }

    return true;
  });

  let error = $derived.by((): string | null => {
    if (!currentTab || !currentTab.url) {
      return "Failed to access current tab.";
    }

    if (!isRedditThread) {
      return "Current tab is not a Reddit thread.";
    }

    return null;
  });

  onMount(() => {
    browser.tabs
      .query({
        active: true,
        currentWindow: true,
      })
      .then((tabs) => {
        currentTab = tabs[0] || null;
      });
  });

  const onDownloadClick = async () => {
    currentDownloadState = DOWNLOAD_STATE.IN_PROGRESS;

    try {
      const thread = await fetchThread(currentTab?.url || "");
      const comments = await thread.resolveComments();

      const csv: string = Object.values(comments)
        .reduce(
          (acc, item) => [
            ...acc,
            `"${item.id}", "${item.authorName}", "${item.body}"`,
          ],
          ['"id", "author", "body"'],
        )
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const downloadId = await browser.downloads.download({
        url,
        filename: "thread.csv",
        saveAs: true,
      });

      await new Promise<void>((resolve, reject) => {
        const onChanged = (delta: Browser.downloads.DownloadDelta) => {
          if (delta.id !== downloadId) {
            return;
          }

          if (delta.state?.current === "complete") {
            browser.downloads.onChanged.removeListener(onChanged);
            return resolve();
          }

          if (delta.state?.current === "interrupted") {
            browser.downloads.onChanged.removeListener(onChanged);
            return reject(
              new Error(delta.error?.current ?? "Download interrupted"),
            );
          }
        };

        browser.downloads.onChanged.addListener(onChanged);
      });

      currentDownloadState = DOWNLOAD_STATE.SUCCESS;
    } catch (e) {
      if (!(e instanceof Error)) {
        console.error("UNHANDLED ERROR: ", e);
        throw e;
      }

      currentDownloadState = DOWNLOAD_STATE.ERROR;
      error = e.message;
    }
  };
</script>

<div class="p-4">
  <h1 class="text-xl font-semibold mb-4">Reddit CSV Exporter</h1>

  <div class="mb-4">
    {#if error}
      <Callout type="error">{error}</Callout>
    {:else if currentTab && isRedditThread}
      <Callout type="info" header="Thread Found">{currentTab.title}</Callout>
    {/if}
  </div>

  {#if isRedditThread}
    <div class="flex justify-end">
      {currentDownloadState}
      {#if currentDownloadState == DOWNLOAD_STATE.READY || currentDownloadState == DOWNLOAD_STATE.SUCCESS}
        <Button onclick={onDownloadClick} type="primary" icon={FileDown}
          >Download CSV</Button
        >
      {:else if currentDownloadState == DOWNLOAD_STATE.IN_PROGRESS}
        <Button disabled type="primary" icon={LoaderCircle} iconSpin>
          Download...
        </Button>
      {/if}
    </div>
  {/if}
</div>
