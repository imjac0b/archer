import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon, Settings2Icon, XIcon } from "lucide-react";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";

const ARCHER_FOLDER_TITLE = "Archer";
const TOP_PINS_FOLDER_TITLE = "Top Pins";
const ABOVE_SEPARATOR_FOLDER_TITLE = "Above Separator";

type BookmarkFolderData = {
  aboveSeparatorBookmarks: browser.bookmarks.BookmarkTreeNode[];
  topPinnedBookmarks: browser.bookmarks.BookmarkTreeNode[];
};

function Favicon({
  alt,
  className,
  src,
}: {
  alt: string;
  className?: string;
  src?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-4 min-w-4 shrink-0 items-center justify-center ${className ?? ""}`}
    >
      {src ? <img src={src} alt={alt} className="h-4 w-4" /> : null}
    </span>
  );
}

async function openBookmarkTarget(url: string, refetchTabs: () => void) {
  const existingTabs = await browser.tabs.query({ currentWindow: true, url });
  const matchingTab = existingTabs[0];

  if (matchingTab?.id) {
    await browser.tabs.update(matchingTab.id, { active: true });

    if (matchingTab.windowId !== undefined) {
      await browser.windows.update(matchingTab.windowId, { focused: true });
    }

    refetchTabs();
    return;
  }

  await browser.tabs.create({ url });
  refetchTabs();
}

async function ensureFolder(
  parentId: string,
  title: string,
): Promise<browser.bookmarks.BookmarkTreeNode> {
  const children = await browser.bookmarks.getChildren(parentId);
  const existingFolder = children.find(
    (child) => !child.url && child.title === title,
  );

  if (existingFolder) {
    return existingFolder;
  }

  return browser.bookmarks.create({ parentId, title });
}

async function getArcherBookmarkFolders(): Promise<BookmarkFolderData> {
  const [tree] = await browser.bookmarks.getTree();
  const rootFolder =
    tree.children?.find((node) => node.id === "1") ?? tree.children?.[0];

  if (!rootFolder?.id) {
    return {
      aboveSeparatorBookmarks: [],
      topPinnedBookmarks: [],
    };
  }

  const archerFolder = await ensureFolder(rootFolder.id, ARCHER_FOLDER_TITLE);
  const topPinsFolder = await ensureFolder(
    archerFolder.id,
    TOP_PINS_FOLDER_TITLE,
  );
  const aboveSeparatorFolder = await ensureFolder(
    archerFolder.id,
    ABOVE_SEPARATOR_FOLDER_TITLE,
  );

  const [topPinnedBookmarks, aboveSeparatorBookmarks] = await Promise.all([
    browser.bookmarks.getChildren(topPinsFolder.id),
    browser.bookmarks.getChildren(aboveSeparatorFolder.id),
  ]);

  return {
    aboveSeparatorBookmarks: aboveSeparatorBookmarks.filter((node) => !!node.url),
    topPinnedBookmarks: topPinnedBookmarks.filter((node) => !!node.url),
  };
}

function App() {
  const visibleTabsRef = useRef<HTMLDivElement>(null);
  const { data: tabs, refetch: refetchTabs } = useQuery({
    queryKey: ["tabs"],
    queryFn: () => browser.tabs.query({ currentWindow: true }),
    refetchInterval: 1000,
  });

  const { data: bookmarkFolders, refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarks", "archer-folders"],
    queryFn: getArcherBookmarkFolders,
    refetchInterval: 1000,
  });

  useEffect(() => {
    const handleTabsChange = () => {
      refetchTabs();
    };

    const handleBookmarksChange = () => {
      refetchBookmarks();
    };

    browser.tabs.onCreated.addListener(handleTabsChange);
    browser.tabs.onRemoved.addListener(handleTabsChange);
    browser.tabs.onUpdated.addListener(handleTabsChange);
    browser.tabs.onActivated.addListener(handleTabsChange);

    browser.bookmarks.onChanged.addListener(handleBookmarksChange);
    browser.bookmarks.onRemoved.addListener(handleBookmarksChange);
    browser.bookmarks.onCreated.addListener(handleBookmarksChange);
    browser.bookmarks.onMoved.addListener(handleBookmarksChange);

    return () => {
      browser.tabs.onCreated.removeListener(handleTabsChange);
      browser.tabs.onRemoved.removeListener(handleTabsChange);
      browser.tabs.onUpdated.removeListener(handleTabsChange);
      browser.tabs.onActivated.removeListener(handleTabsChange);

      browser.bookmarks.onChanged.removeListener(handleBookmarksChange);
      browser.bookmarks.onRemoved.removeListener(handleBookmarksChange);
      browser.bookmarks.onCreated.removeListener(handleBookmarksChange);
      browser.bookmarks.onMoved.removeListener(handleBookmarksChange);
    };
  }, [refetchBookmarks, refetchTabs]);

  if (!tabs) return null;

  const topPinnedBookmarks = bookmarkFolders?.topPinnedBookmarks ?? [];
  const aboveSeparatorBookmarks = bookmarkFolders?.aboveSeparatorBookmarks ?? [];
  const tabsClaimedByBookmarks = new Set<number>();

  for (const bookmark of [...topPinnedBookmarks, ...aboveSeparatorBookmarks]) {
    if (!bookmark.url) {
      continue;
    }

    const firstMatchingTab = tabs.find(
      (tab) => tab.url === bookmark.url && tab.id !== undefined,
    );

    if (firstMatchingTab?.id !== undefined) {
      tabsClaimedByBookmarks.add(firstMatchingTab.id);
    }
  }

  const visibleTabs = tabs.filter(
    (tab) => tab.id === undefined || !tabsClaimedByBookmarks.has(tab.id),
  );

  useEffect(() => {
    const container = visibleTabsRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [visibleTabs.length]);

  const getBookmarkTabState = (url: string) => {
    const matchingTab = tabs.find((tab) => tab.url === url);

    return {
      hasMatchingTab: !!matchingTab,
      isActive: !!matchingTab?.active,
    };
  };

  return (
    <main className="flex h-screen flex-col gap-2 overflow-hidden p-4">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.min(
            Math.max(topPinnedBookmarks.length, 1),
            3,
          )}, minmax(0, 1fr))`,
        }}
      >
        {topPinnedBookmarks.map((bookmark) => (
          (() => {
            if (!bookmark.url) return null;

            const bookmarkTabState = getBookmarkTabState(bookmark.url);

            return (
              <Button
                key={bookmark.id}
                variant={bookmarkTabState.isActive ? "secondary" : "outline"}
                className="w-full px-3"
                onClick={async () => {
                  await openBookmarkTarget(bookmark.url!, refetchTabs);
                }}
              >
                <Favicon
                  src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=128`}
                  alt={bookmark.title || bookmark.url}
                  className={`h-4 w-4 ${bookmarkTabState.hasMatchingTab ? "opacity-100" : "opacity-70"}`}
                />
              </Button>
            );
          })()
        ))}
      </div>

      {aboveSeparatorBookmarks.map((bookmark) => (
        (() => {
          if (!bookmark.url) return null;

          const bookmarkTabState = getBookmarkTabState(bookmark.url);

          return (
            <Button
              key={bookmark.id}
              variant={bookmarkTabState.isActive ? "secondary" : "ghost"}
              className="justify-start px-3"
              onClick={async () => {
                await openBookmarkTarget(bookmark.url!, refetchTabs);
              }}
            >
              <Favicon
                src={`https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=128`}
                alt={bookmark.title || bookmark.url}
                className={`h-4 w-4 ${bookmarkTabState.hasMatchingTab ? "opacity-100" : "opacity-70"}`}
              />
              <span className="truncate text-sm">{bookmark.title || bookmark.url}</span>
            </Button>
          );
        })()
      ))}

      <div className="group relative py-2">
        <Separator />
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 transform bg-[#3C3C3C] font-bold opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => {
            browser.tabs.remove(
              tabs
                .filter((tab) => !tab.active && !tab.audible)
                .map((tab) => tab.id!)
                .filter((id) => id !== undefined),
            );
            refetchTabs();
          }}
        >
          Clear
        </button>
      </div>

      <div ref={visibleTabsRef} className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleTabs.map((tab) => (
          <div key={tab.id} className="group relative">
            <Button
              variant={tab.active ? "secondary" : "ghost"}
              className="w-full justify-start px-3 pr-8"
              onClick={() => {
                if (tab.id) {
                  browser.tabs.update(tab.id, { active: true });
                  refetchTabs();
                }
              }}
            >
              <Favicon
                src={tab.favIconUrl}
                alt={tab.title || tab.url || "Tab"}
              />
              <span className="truncate text-sm">{tab.title}</span>
            </Button>
            <Button
              size="sm"
              className="absolute right-2 top-1/2 h-auto -translate-y-1/2 transform bg-secondary p-1 opacity-0 transition-opacity has-[>svg]:px-1 group-hover:opacity-100"
              onClick={() => {
                if (tab.id) {
                  browser.tabs.remove(tab.id);
                  refetchTabs();
                }
              }}
              variant="outline"
            >
              <XIcon />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-2">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full border border-border"
          onClick={() => {
            browser.runtime.openOptionsPage();
          }}
        >
          <Settings2Icon />
        </Button>
        <Button
          variant="secondary"
          className="h-9 max-w-full flex-1 justify-center rounded-full border border-border"
          onClick={() => {
            browser.tabs.create({ active: true });
            refetchTabs();
          }}
        >
          <PlusIcon /> New tab
        </Button>
      </div>
    </main>
  );
}

export default App;
