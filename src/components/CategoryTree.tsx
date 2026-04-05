import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon, FolderIcon, FilePlusIcon } from "lucide-react";
import { getCategoryTree } from "@dataconnect/generated";
import type { GetCategoryTreeData } from "@dataconnect/generated";
import dataConnect from "@/lib/dataconnect";
import { useAuth } from "@/contexts/AuthContext";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

// Recursive type derived from the generated SDK shape
type CategoryNode = GetCategoryTreeData["categories"][number];

function CategoryItem({ category, depth = 0 }: { category: CategoryNode; depth?: number }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  const handleClick = () => {
    navigate(`/wiki/category/${category.id}`);
    if (hasChildren) setOpen((o) => !o);
  };

  if (depth === 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleClick} tooltip={category.name}>
          <FolderIcon />
          <span>{category.name}</span>
          {hasChildren && (
            <ChevronRightIcon
              className={`ml-auto size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            />
          )}
        </SidebarMenuButton>

        {hasChildren && open && (
          <SidebarMenuSub>
            {category.children.map((child) => (
              <CategorySubItem key={child.id} category={child} depth={depth + 1} />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return <CategorySubItem category={category} depth={depth} />;
}

function CategorySubItem({
  category,
  depth,
}: {
  category: CategoryNode["children"][number];
  depth: number;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  // children exists on all levels (up to 4 deep)
  const children = (category as CategoryNode).children ?? [];
  const hasChildren = children.length > 0;

  const handleClick = () => {
    navigate(`/wiki/category/${category.id}`);
    if (hasChildren) setOpen((o) => !o);
  };

  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton onClick={handleClick}>
        <span>{category.name}</span>
        {hasChildren && (
          <ChevronRightIcon
            className={`ml-auto size-3 transition-transform ${open ? "rotate-90" : ""}`}
          />
        )}
      </SidebarMenuSubButton>

      {hasChildren && open && (
        <SidebarMenuSub>
          {children.map((child) => (
            <CategorySubItem key={child.id} category={child} depth={depth + 1} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuSubItem>
  );
}

export default function CategoryTree() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<GetCategoryTreeData["categories"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryTree(dataConnect)
      .then((res) => setCategories(res.data.categories))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const canCreate = role === "EXPERT" || role === "ADMIN";

  return (
    <>
      {/* T25: Categories section */}
      <SidebarGroup>
        <SidebarGroupLabel>Categories</SidebarGroupLabel>

        <SidebarGroupContent>
          {loading ? (
            <div className="space-y-1 px-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full rounded" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">No categories yet.</p>
          ) : (
            <SidebarMenu>
              {categories.map((cat) => (
                <CategoryItem key={cat.id} category={cat} depth={0} />
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* T25: Separator + Actions section (T24: tooltip via SidebarMenuButton tooltip prop) */}
      {canCreate && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  {/* T24: tooltip handled by SidebarMenuButton's built-in tooltip prop */}
                  <SidebarMenuButton
                    onClick={() => navigate("/wiki/edit")}
                    tooltip="New article"
                  >
                    <FilePlusIcon />
                    <span>New Article</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
    </>
  );
}

