import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Article_Key {
  id: UUIDString;
  __typename?: 'Article_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface DeleteArticleData {
  article_delete?: Article_Key | null;
}

export interface DeleteArticleVariables {
  id: UUIDString;
}

export interface DeleteCategoryData {
  category_delete?: Category_Key | null;
}

export interface DeleteCategoryVariables {
  id: UUIDString;
}

export interface GetArticleBySlugData {
  article?: {
    id: UUIDString;
    title: string;
    slug: string;
    content: unknown;
    isPublished: boolean;
    createdAt: TimestampString;
    category: {
      id: UUIDString;
      name: string;
    } & Category_Key;
      author: {
        id: string;
        email: string;
      } & User_Key;
  } & Article_Key;
}

export interface GetArticleBySlugVariables {
  slug: string;
}

export interface GetArticlesByCategoryData {
  articles: ({
    id: UUIDString;
    title: string;
    slug: string;
    isPublished: boolean;
    createdAt: TimestampString;
    author: {
      id: string;
      email: string;
    } & User_Key;
  } & Article_Key)[];
}

export interface GetArticlesByCategoryVariables {
  categoryId: UUIDString;
}

export interface GetCategoryTreeData {
  categories: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    children: ({
      id: UUIDString;
      name: string;
      description?: string | null;
      children: ({
        id: UUIDString;
        name: string;
        description?: string | null;
        children: ({
          id: UUIDString;
          name: string;
          description?: string | null;
        } & Category_Key)[];
      } & Category_Key)[];
    } & Category_Key)[];
  } & Category_Key)[];
}

export interface UpdateArticleData {
  article_update?: Article_Key | null;
}

export interface UpdateArticleVariables {
  id: UUIDString;
  title: string;
  slug: string;
  content: unknown;
  categoryId: UUIDString;
  isPublished?: boolean | null;
}

export interface UpsertArticleData {
  article_upsert: Article_Key;
}

export interface UpsertArticleVariables {
  id?: UUIDString | null;
  title: string;
  slug: string;
  content: unknown;
  categoryId: UUIDString;
  isPublished?: boolean | null;
}

export interface UpsertCategoryData {
  category_upsert: Category_Key;
}

export interface UpsertCategoryVariables {
  id?: UUIDString | null;
  name: string;
  description?: string | null;
  parentId?: UUIDString | null;
}

export interface UpsertUserData {
  user_upsert: User_Key;
}

export interface UpsertUserVariables {
  email: string;
}

export interface User_Key {
  id: string;
  __typename?: 'User_Key';
}

interface UpsertArticleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertArticleVariables): MutationRef<UpsertArticleData, UpsertArticleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertArticleVariables): MutationRef<UpsertArticleData, UpsertArticleVariables>;
  operationName: string;
}
export const upsertArticleRef: UpsertArticleRef;

export function upsertArticle(vars: UpsertArticleVariables): MutationPromise<UpsertArticleData, UpsertArticleVariables>;
export function upsertArticle(dc: DataConnect, vars: UpsertArticleVariables): MutationPromise<UpsertArticleData, UpsertArticleVariables>;

interface UpdateArticleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateArticleVariables): MutationRef<UpdateArticleData, UpdateArticleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateArticleVariables): MutationRef<UpdateArticleData, UpdateArticleVariables>;
  operationName: string;
}
export const updateArticleRef: UpdateArticleRef;

export function updateArticle(vars: UpdateArticleVariables): MutationPromise<UpdateArticleData, UpdateArticleVariables>;
export function updateArticle(dc: DataConnect, vars: UpdateArticleVariables): MutationPromise<UpdateArticleData, UpdateArticleVariables>;

interface DeleteArticleRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteArticleVariables): MutationRef<DeleteArticleData, DeleteArticleVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteArticleVariables): MutationRef<DeleteArticleData, DeleteArticleVariables>;
  operationName: string;
}
export const deleteArticleRef: DeleteArticleRef;

export function deleteArticle(vars: DeleteArticleVariables): MutationPromise<DeleteArticleData, DeleteArticleVariables>;
export function deleteArticle(dc: DataConnect, vars: DeleteArticleVariables): MutationPromise<DeleteArticleData, DeleteArticleVariables>;

interface UpsertCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
  operationName: string;
}
export const upsertCategoryRef: UpsertCategoryRef;

export function upsertCategory(vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;
export function upsertCategory(dc: DataConnect, vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface DeleteCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCategoryVariables): MutationRef<DeleteCategoryData, DeleteCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteCategoryVariables): MutationRef<DeleteCategoryData, DeleteCategoryVariables>;
  operationName: string;
}
export const deleteCategoryRef: DeleteCategoryRef;

export function deleteCategory(vars: DeleteCategoryVariables): MutationPromise<DeleteCategoryData, DeleteCategoryVariables>;
export function deleteCategory(dc: DataConnect, vars: DeleteCategoryVariables): MutationPromise<DeleteCategoryData, DeleteCategoryVariables>;

interface UpsertUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
  operationName: string;
}
export const upsertUserRef: UpsertUserRef;

export function upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;
export function upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface GetCategoryTreeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCategoryTreeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetCategoryTreeData, undefined>;
  operationName: string;
}
export const getCategoryTreeRef: GetCategoryTreeRef;

export function getCategoryTree(options?: ExecuteQueryOptions): QueryPromise<GetCategoryTreeData, undefined>;
export function getCategoryTree(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCategoryTreeData, undefined>;

interface GetArticlesByCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetArticlesByCategoryVariables): QueryRef<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetArticlesByCategoryVariables): QueryRef<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;
  operationName: string;
}
export const getArticlesByCategoryRef: GetArticlesByCategoryRef;

export function getArticlesByCategory(vars: GetArticlesByCategoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;
export function getArticlesByCategory(dc: DataConnect, vars: GetArticlesByCategoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;

interface GetArticleBySlugRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetArticleBySlugVariables): QueryRef<GetArticleBySlugData, GetArticleBySlugVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetArticleBySlugVariables): QueryRef<GetArticleBySlugData, GetArticleBySlugVariables>;
  operationName: string;
}
export const getArticleBySlugRef: GetArticleBySlugRef;

export function getArticleBySlug(vars: GetArticleBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticleBySlugData, GetArticleBySlugVariables>;
export function getArticleBySlug(dc: DataConnect, vars: GetArticleBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticleBySlugData, GetArticleBySlugVariables>;

