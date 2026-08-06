import {
  arrayChunk,
  forEachAsync,
  mapAsync,
  RateLimiter,
  reduceAsync,
} from "./utils";

interface ThreadResponseElement<K extends string, T> {
  kind: K;
  data: T;
}

type ThreadResponsePost = ThreadResponseElement<
  "t3",
  {
    id: string;
    name: string;
    author: string;
    author_fullname: string;
    subreddit: string;
    title: string;
    body: string;
    ups: number;
    downs: number;
  }
>;

type ThreadResponseMore = ThreadResponseElement<
  "more",
  {
    id: string;
    parent_id: string;
    children: string[];
  }
>;

type ThreadResponseComment = ThreadResponseElement<
  "t1",
  {
    id: string;
    author: string;
    author_fullname: string;
    parent_id: string;
    body: string;
    created_utc: number;
    ups: number;
    downs: number;
    replies: "" | ThreadResponseCommentListing;
  }
>;

type ThreadResponseListing<T> = ThreadResponseElement<
  "Listing",
  { children: T[] }
>;

type ThreadResponseCommentListing = ThreadResponseListing<
  ThreadResponseComment | ThreadResponseMore
>;

interface Post {
  id: string;
  authorName: string;
  authorID: string;
  subreddit: string;
  title: string;
  body: string;
  upvotes: number;
  downvotes: number;
}

interface Comment {
  id: string;
  parentID: string;
  authorName: string;
  authorID: string;
  body: string;
  upvotes: number;
  downvotes: number;
}

interface MoreChildrenResponse {
  json: {
    errors: any[];
    data: {
      things: ThreadResponseCommentListing["data"]["children"];
    };
  };
}

type IThreadResponse = [
  ThreadResponseListing<ThreadResponsePost>,
  ThreadResponseCommentListing,
];

const shortID = (id: string): string => id.replace(/^t\d_/, "");

class Reddit {
  private rateLimiter: RateLimiter = new RateLimiter(1000);

  async fetch(url: string): Promise<Response> {
    return this.rateLimiter.enqueue<Response>(async () => fetch(url));
  }

  async fetchMoreChildren(
    threadId: string,
    children: string[],
  ): Promise<MoreChildrenResponse> {
    console.log("fetchMoreChildren", children);
    const params = new URLSearchParams({
      api_type: "json",
      limit_children: "false",
      link_id: threadId,
      depth: "9999",
      children: children.join(","),
    });

    const url = `https://reddit.com/api/morechildren.json?${params.toString()}`;

    const resp = await this.fetch(url);
    const json: MoreChildrenResponse = await resp.json();

    return json;
  }

  async fetchThread(url: string): Promise<ThreadResponse> {
    console.log(`fetchThread: ${url}`);

    const parsedURL = URL.parse(url);
    if (!parsedURL) {
      throw new Error(`failed to parse URL: ${url}`);
    }

    parsedURL.pathname = parsedURL.pathname + ".json";

    const resp = await fetch(parsedURL.toString());
    return new ThreadResponse(await resp.json());
  }

  async fetchThreadComment(
    subreddit: string,
    threadID: string,
    commentID: string,
  ): Promise<IThreadResponse> {
    console.log(`fetchThreadComment: ${commentID}`);
    const resp = await fetch(
      `https://www.reddit.com/r/${subreddit}/comments/${shortID(threadID)}/comment/${shortID(commentID)}.json`,
    );

    return resp.json();
  }
}

const reddit: Reddit = new Reddit();

export const fetchThread = reddit.fetchThread.bind(reddit);
export const fetchMoreChildren = reddit.fetchMoreChildren.bind(reddit);
export const fetchThreadComment = reddit.fetchThreadComment.bind(reddit);

class ThreadResponse {
  private comments: Record<string, Comment> = {};

  private moreIds: string[] = [];

  private breadcrumb: string[] = [];

  constructor(private data: IThreadResponse) {}

  get post(): Post {
    const { data } = this.data[0].data.children[0];

    return {
      id: data.name,
      authorName: data.author,
      authorID: data.author_fullname,
      subreddit: data.subreddit,
      title: data.title,
      body: data.body,
      upvotes: data.ups,
      downvotes: data.downs,
    };
  }

  private async resolveMore(): Promise<void> {
    const children = this.moreIds.splice(0, 50);

    const moreResp = await fetchMoreChildren(this.post.id, children);

    await this.resolveCommentsListing({
      kind: "Listing",
      data: {
        children: moreResp.json.data.things,
      },
    });
  }

  private async resolveComment({ data }: ThreadResponseComment): Promise<void> {
    this.breadcrumb.push(data.id);
    console.log(`(resolveComment) ${this.breadcrumb.join("->")}`);

    if (data.replies != "") {
      await this.resolveCommentsListing(data.replies);
    }

    this.comments[data.id] = {
      id: data.id,
      parentID: data.parent_id,
      authorName: data.author,
      authorID: data.author_fullname,
      body: data.body,
      upvotes: data.ups,
      downvotes: data.downs,
    };

    this.breadcrumb.pop();
  }

  private async resolveCommentReply(more: ThreadResponseMore): Promise<void> {
    console.log(`(resolveCommentReply) ${this.breadcrumb.join("->")}`);
    const [_, listing] = await fetchThreadComment(
      this.post.subreddit,
      this.post.id,
      more.data.parent_id,
    );

    await this.resolveCommentsListing(listing);
  }

  private async resolveCommentsListing(
    listing: ThreadResponseListing<ThreadResponseComment | ThreadResponseMore>,
  ): Promise<void> {
    await forEachAsync(listing.data.children, async (item) => {
      if (item.kind == "more" && item.data.id == "_") {
        await this.resolveCommentReply(item);
      } else if (item.kind == "more") {
        this.moreIds = [...this.moreIds, ...item.data.children];
      } else {
        await this.resolveComment(item);
      }
    });
  }

  async resolveComments(): Promise<typeof this.comments> {
    await this.resolveCommentsListing(this.data[1]);

    while (this.moreIds.length > 0) {
      await this.resolveMore();
    }

    return this.comments;
  }

  getComments(): typeof this.comments {
    return this.comments;
  }
}
