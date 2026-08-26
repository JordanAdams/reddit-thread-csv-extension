<script lang="ts">
  import { FileDown, LoaderCircle } from "@lucide/svelte";
  import { downloadFile } from "../download";
  import { fetchThread } from "../reddit";
  import Button from "./Button.svelte";
  import { stringify as csvStringify } from "csv-stringify/browser/esm/sync";

  type State = "ready" | "in_progress" | "success" | "error";

  interface Props {
    threadURL: string;
    onError?: (error: Error) => void;
    onSuccess?: (filename: string) => void;
    onClick?: () => void;
  }

  let props: Props = $props();

  let currentState = $state<State>("ready");

  let downloadedFile = $state<string>("");

  let error = $state<Error | null>(null);

  $effect(() => {
    if (currentState === "error") {
      if (error && props.onError) {
        props.onError(error);
      }

      setTimeout(() => {
        currentState = "ready";
      }, 1000);
    } else if (currentState === "success") {
      if (props.onSuccess) {
        props.onSuccess(downloadedFile);
      }
      setTimeout(() => ((currentState = "ready"), 1000));
    }
  });

  const onClick = async () => {
    if (props.onClick) {
      props.onClick();
    }

    error = null;
    currentState = "in_progress";

    try {
      const thread = await fetchThread(props.threadURL);
      const comments = await thread.resolveComments();

      const rows = [
        [
          "id",
          "parent_id",
          "created_at",
          "author",
          "body",
          "upvotes",
          "downvotes",
        ],
        ...Object.values(comments).map((item) => [
          item.id,
          item.parentID?.replace(/^t\d_/, "") || "",
          `${item.createdAt.getDate()}-${item.createdAt.getMonth() + 1}-${item.createdAt.getFullYear()}`,
          item.authorName,
          item.body,
          item.upvotes,
          item.downvotes,
        ]),
      ];

      downloadedFile = await downloadFile(
        `${thread.post.title.replaceAll(/[^a-z0-9]/gi, "")}.csv`,
        csvStringify(rows),
      );
      currentState = "success";
    } catch (err) {
      if (!(err instanceof Error)) {
        console.error("UNKNOWN ERROR: ", err);
        throw err;
      }

      console.error("ERROR: ", err);

      error = err;
      currentState = "error";
    }
  };
</script>

{#if currentState == "ready"}
  <Button onclick={onClick} type="primary" icon={FileDown}>Download CSV</Button>
{:else if currentState == "in_progress"}
  <Button disabled type="primary" icon={LoaderCircle} iconSpin>
    Download...
  </Button>
{/if}
