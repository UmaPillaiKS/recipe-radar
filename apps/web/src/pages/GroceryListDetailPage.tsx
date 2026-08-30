import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Checkbox } from "../components/ui/checkbox";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { API_BASE } from "../lib/api";
import { getErrorMessage } from "../lib/errors";

type Item = {
  id: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  ingredient: { name: string };
};

type List = {
  id: string;
  name: string;
  recipes: Array<{ recipe: { id: string; title: string } }>;
  items: Item[];
};

function fmtAmount(amount: number | null, unit: string | null) {
  if (amount == null && !unit) return "";
  const a = amount == null ? "" : String(amount);
  const u = unit ?? "";
  return `${a} ${u}`.trim();
}

export function GroceryListDetailPage() {
  const { id } = useParams();
  const [list, setList] = useState<List | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);


  async function load() {
    if (!id) return;

    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/grocery-lists/${id}`);
      if (!res.ok) {
        setList(null);
        return;
      }
      setList(await res.json());
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Failed to load"));
      setList(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const progress = useMemo(() => {
    if (!list) return { done: 0, total: 0, pct: 0 };
    const total = list.items.length;
    const done = list.items.filter((x) => x.checked).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { done, total, pct };
  }, [list]);

  async function toggle(itemId: string, checked: boolean) {
    // optimistic
    setList((prev) =>
      prev ? { ...prev, items: prev.items.map((x) => (x.id === itemId ? { ...x, checked } : x)) } : prev
    );

    const res = await fetch(`${API_BASE}/grocery-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });

    if (!res.ok) {
      // revert if failed
      setList((prev) =>
        prev ? { ...prev, items: prev.items.map((x) => (x.id === itemId ? { ...x, checked: !checked } : x)) } : prev
      );
      setErr(await res.text());
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-48 rounded-md bg-muted/40" />
        <div className="h-28 rounded-lg bg-muted/40" />
        <div className="h-48 rounded-lg bg-muted/40" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="space-y-4">
        <Button asChild variant="secondary">
          <Link to="/grocery/lists">← Saved lists</Link>
        </Button>

        <EmptyState
          title="List not found"
          description={err ?? "This list may have been deleted."}
          action={
            <Button asChild>
              <Link to="/grocery/lists">Go to saved lists</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={list.name}
        description="Check off items as you shop."
        actions={
          <Button asChild variant="secondary">
            <Link to="/grocery/lists">← Saved lists</Link>
          </Button>
        }
      />

      {err && (
        <Card className="p-4 border-destructive/40">
          <div className="text-sm text-destructive whitespace-pre-wrap">{err}</div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 space-y-4 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Progress</div>
              <div className="text-2xl font-semibold tracking-tight">
                {progress.done}/{progress.total}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{progress.pct}% complete</div>
            </div>
            <Badge variant="secondary">{list.items.length} items</Badge>
          </div>

          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-medium">Dishes</div>
            <div className="flex flex-wrap gap-2">
              {list.recipes.length === 0 ? (
                <span className="text-sm text-muted-foreground">No dishes linked</span>
              ) : (
                list.recipes.map((r) => (
                  <Badge key={r.recipe.id} variant="secondary">
                    {r.recipe.title}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <Separator />

          <Button asChild variant="secondary" className="w-full">
            <Link to="/grocery">Generate another list</Link>
          </Button>
        </Card>
        <Card className="p-6 space-y-4 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Shopping list</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tap items to mark them done.
              </p>
            </div>
            <Badge variant="outline">
              {progress.total === 0 ? "Empty" : `${progress.total - progress.done} left`}
            </Badge>
          </div>

          <Separator />

          {list.items.length === 0 ? (
            <EmptyState
              title="No items"
              description="This list has no ingredients. Try generating again with different dishes."
              action={
                <Button asChild>
                  <Link to="/grocery">Generate a list</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {list.items.map((it) => {
                const qty = fmtAmount(it.amount, it.unit);

                return (
                  <label
                    key={it.id}
                    className={[
                      "flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer",
                      "hover:bg-accent/10 transition",
                      it.checked ? "opacity-70" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={it.checked}
                        onCheckedChange={(v) => toggle(it.id, Boolean(v))}
                      />

                      <div className="min-w-0">
                        <div className={["font-medium truncate", it.checked ? "line-through" : ""].join(" ")}>
                          {it.ingredient.name}
                        </div>
                        {qty ? (
                          <div className="text-xs text-muted-foreground mt-1">{qty}</div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">Quantity not specified</div>
                        )}
                      </div>
                    </div>

                    {qty ? <Badge variant="secondary">{qty}</Badge> : <Badge variant="outline">qty?</Badge>}
                  </label>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
