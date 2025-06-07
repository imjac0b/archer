import { useEffect } from "react";
import { Button } from "./components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";
import { Separator } from "./components/ui/separator";
import { useQuery } from "@tanstack/react-query";

function App() {
  const { data: tabs, refetch: refetchTabs } = useQuery({
    queryKey: ["tabs"],
    queryFn: () => browser.tabs.query({ currentWindow: true }),
    refetchInterval: 1000,
  });

  const { data: bookmarks, refetch: refetchBookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const [tree] = await browser.bookmarks.getTree();
      return tree.children?.flatMap((node) => node.children);
    },
    refetchInterval: 1000,
  });

  useEffect(() => {
    browser.tabs.onCreated.addListener(() => refetchTabs());
    browser.tabs.onRemoved.addListener(() => refetchTabs());
    browser.tabs.onUpdated.addListener(() => refetchTabs());
    browser.tabs.onActivated.addListener(() => refetchTabs());

    browser.bookmarks.onChanged.addListener(() => refetchBookmarks());
    browser.bookmarks.onRemoved.addListener(() => refetchBookmarks());
    browser.bookmarks.onCreated.addListener(() => refetchBookmarks());

    return () => {
      browser.tabs.onCreated.removeListener(() => refetchTabs());
      browser.tabs.onRemoved.removeListener(() => refetchTabs());
      browser.tabs.onUpdated.removeListener(() => refetchTabs());
      browser.tabs.onActivated.removeListener(() => refetchTabs());

      browser.bookmarks.onChanged.removeListener(() => refetchBookmarks());
      browser.bookmarks.onRemoved.removeListener(() => refetchBookmarks());
      browser.bookmarks.onCreated.removeListener(() => refetchBookmarks());
    };
  }, []);

  if (!tabs) return null;

  return (
    <>
      <main className="p-4 flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2">
          {bookmarks?.map((bookmark) => (
            <Button
              key={bookmark?.id}
              variant="outline"
              className="px-3 w-full"
              onClick={() => {
                if (bookmark?.id) {
                  browser.tabs.create({ url: bookmark.url });
                  refetchTabs();
                }
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${bookmark?.url}&sz=128`}
                alt={bookmark?.url}
                className="w-4 h-4"
              />
            </Button>
          ))}
        </div>
        <div className="py-2 relative group">
          <Separator />
          <button
            className="absolute right-0 bg-[#3C3C3C] top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity font-bold"
            onClick={() => {
              browser.tabs.remove(
                tabs
                  .filter((tab) => !tab.active && !tab.audible)
                  .map((tab) => tab.id!)
                  .filter((id) => id !== undefined)
              );
              refetchTabs();
            }}
          >
            Clear
          </button>
        </div>
        {tabs.map((tab) => (
          <div key={tab.id} className="relative group">
            <Button
              variant={tab.active ? "secondary" : "ghost"}
              className="justify-start w-full pr-8 px-3"
              onClick={() => {
                if (tab.id) {
                  browser.tabs.update(tab.id, { active: true });
                  refetchTabs();
                }
              }}
            >
              {tab.favIconUrl && (
                <img src={tab.favIconUrl} alt={tab.title} className="w-4 h-4" />
              )}
              <span className="text-sm truncate">{tab.title}</span>
            </Button>
            <Button
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto has-[>svg]:px-1 bg-secondary"
              onClick={(e) => {
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
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => {
            browser.tabs.create({ active: true });
            refetchTabs();
          }}
        >
          <PlusIcon /> New tab
        </Button>
      </main>
    </>
  );
}

export default App;
