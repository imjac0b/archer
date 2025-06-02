import { useEffect } from "react";
import { useAsyncRetry } from "react-use";
import { Button } from "./components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";
import { Separator } from "./components/ui/separator";

function App() {
  let { value: tabs, retry: refetch } = useAsyncRetry(async () => {
    return browser.tabs.query({ currentWindow: true });
  }, []);

  let { value: bookmarks, retry: refetchBookmarks } =
    useAsyncRetry(async () => {
      const [tree] = await browser.bookmarks.getTree();
      return tree.children?.flatMap((node) => node.children);
    }, []);

  console.log(bookmarks);

  useEffect(() => {
    refetch();

    browser.tabs.onCreated.addListener(refetch);
    browser.tabs.onRemoved.addListener(refetch);
    browser.tabs.onUpdated.addListener(refetch);
    browser.tabs.onActivated.addListener(refetch);

    return () => {
      browser.tabs.onCreated.removeListener(refetch);
      browser.tabs.onRemoved.removeListener(refetch);
      browser.tabs.onUpdated.removeListener(refetch);
      browser.tabs.onActivated.removeListener(refetch);
    };
  }, []);

  if (!tabs) return null;

  return (
    <>
      <main className="p-4 flex flex-col gap-2">
        {bookmarks?.map((bookmark) => (
          <Button
            key={bookmark?.id}
            // variant={tab.active ? "secondary" : "ghost"}
            variant="ghost"
            className="justify-start w-full pr-8 px-3"
            onClick={() => {
              if (bookmark?.id) {
                browser.tabs.create({ url: bookmark.url });
                refetch();
              }
            }}
          >
            {/* {tab.favIconUrl && (
              <img src={tab.favIconUrl} alt={tab.title} className="w-4 h-4" />
            )} */}
            <span className="text-sm truncate">{bookmark?.title}</span>
          </Button>
        ))}
        <Separator />
        {tabs.map((tab) => (
          <div key={tab.id} className="relative group">
            <Button
              variant={tab.active ? "secondary" : "ghost"}
              className="justify-start w-full pr-8 px-3"
              onClick={() => {
                if (tab.id) {
                  browser.tabs.update(tab.id, { active: true });
                  refetch();
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
                  refetch();
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
          className="w-full justify-start"
          onClick={() => {
            browser.tabs.create({ active: true });
            refetch();
          }}
        >
          <PlusIcon /> New tab
        </Button>
      </main>
    </>
  );
}

export default App;
