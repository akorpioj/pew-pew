# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `pew-pew-connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetCategoryTree*](#getcategorytree)
  - [*GetArticlesByCategory*](#getarticlesbycategory)
  - [*GetArticleBySlug*](#getarticlebyslug)
  - [*GetRevisionsByArticle*](#getrevisionsbyarticle)
- [**Mutations**](#mutations)
  - [*UpsertArticle*](#upsertarticle)
  - [*UpdateArticle*](#updatearticle)
  - [*DeleteArticle*](#deletearticle)
  - [*CreateRevision*](#createrevision)
  - [*UpsertCategory*](#upsertcategory)
  - [*DeleteCategory*](#deletecategory)
  - [*UpsertUser*](#upsertuser)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `pew-pew-connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `pew-pew-connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetCategoryTree
You can execute the `GetCategoryTree` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCategoryTree(options?: ExecuteQueryOptions): QueryPromise<GetCategoryTreeData, undefined>;

interface GetCategoryTreeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetCategoryTreeData, undefined>;
}
export const getCategoryTreeRef: GetCategoryTreeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCategoryTree(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetCategoryTreeData, undefined>;

interface GetCategoryTreeRef {
  ...
  (dc: DataConnect): QueryRef<GetCategoryTreeData, undefined>;
}
export const getCategoryTreeRef: GetCategoryTreeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCategoryTreeRef:
```typescript
const name = getCategoryTreeRef.operationName;
console.log(name);
```

### Variables
The `GetCategoryTree` query has no variables.
### Return Type
Recall that executing the `GetCategoryTree` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCategoryTreeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCategoryTree`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCategoryTree } from '@dataconnect/generated';


// Call the `getCategoryTree()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCategoryTree();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCategoryTree(dataConnect);

console.log(data.categories);

// Or, you can use the `Promise` API.
getCategoryTree().then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

### Using `GetCategoryTree`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCategoryTreeRef } from '@dataconnect/generated';


// Call the `getCategoryTreeRef()` function to get a reference to the query.
const ref = getCategoryTreeRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCategoryTreeRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.categories);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.categories);
});
```

## GetArticlesByCategory
You can execute the `GetArticlesByCategory` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getArticlesByCategory(vars: GetArticlesByCategoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;

interface GetArticlesByCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetArticlesByCategoryVariables): QueryRef<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;
}
export const getArticlesByCategoryRef: GetArticlesByCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getArticlesByCategory(dc: DataConnect, vars: GetArticlesByCategoryVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;

interface GetArticlesByCategoryRef {
  ...
  (dc: DataConnect, vars: GetArticlesByCategoryVariables): QueryRef<GetArticlesByCategoryData, GetArticlesByCategoryVariables>;
}
export const getArticlesByCategoryRef: GetArticlesByCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getArticlesByCategoryRef:
```typescript
const name = getArticlesByCategoryRef.operationName;
console.log(name);
```

### Variables
The `GetArticlesByCategory` query requires an argument of type `GetArticlesByCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetArticlesByCategoryVariables {
  categoryId: UUIDString;
}
```
### Return Type
Recall that executing the `GetArticlesByCategory` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetArticlesByCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetArticlesByCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getArticlesByCategory, GetArticlesByCategoryVariables } from '@dataconnect/generated';

// The `GetArticlesByCategory` query requires an argument of type `GetArticlesByCategoryVariables`:
const getArticlesByCategoryVars: GetArticlesByCategoryVariables = {
  categoryId: ..., 
};

// Call the `getArticlesByCategory()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getArticlesByCategory(getArticlesByCategoryVars);
// Variables can be defined inline as well.
const { data } = await getArticlesByCategory({ categoryId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getArticlesByCategory(dataConnect, getArticlesByCategoryVars);

console.log(data.articles);

// Or, you can use the `Promise` API.
getArticlesByCategory(getArticlesByCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.articles);
});
```

### Using `GetArticlesByCategory`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getArticlesByCategoryRef, GetArticlesByCategoryVariables } from '@dataconnect/generated';

// The `GetArticlesByCategory` query requires an argument of type `GetArticlesByCategoryVariables`:
const getArticlesByCategoryVars: GetArticlesByCategoryVariables = {
  categoryId: ..., 
};

// Call the `getArticlesByCategoryRef()` function to get a reference to the query.
const ref = getArticlesByCategoryRef(getArticlesByCategoryVars);
// Variables can be defined inline as well.
const ref = getArticlesByCategoryRef({ categoryId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getArticlesByCategoryRef(dataConnect, getArticlesByCategoryVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.articles);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.articles);
});
```

## GetArticleBySlug
You can execute the `GetArticleBySlug` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getArticleBySlug(vars: GetArticleBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticleBySlugData, GetArticleBySlugVariables>;

interface GetArticleBySlugRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetArticleBySlugVariables): QueryRef<GetArticleBySlugData, GetArticleBySlugVariables>;
}
export const getArticleBySlugRef: GetArticleBySlugRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getArticleBySlug(dc: DataConnect, vars: GetArticleBySlugVariables, options?: ExecuteQueryOptions): QueryPromise<GetArticleBySlugData, GetArticleBySlugVariables>;

interface GetArticleBySlugRef {
  ...
  (dc: DataConnect, vars: GetArticleBySlugVariables): QueryRef<GetArticleBySlugData, GetArticleBySlugVariables>;
}
export const getArticleBySlugRef: GetArticleBySlugRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getArticleBySlugRef:
```typescript
const name = getArticleBySlugRef.operationName;
console.log(name);
```

### Variables
The `GetArticleBySlug` query requires an argument of type `GetArticleBySlugVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetArticleBySlugVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `GetArticleBySlug` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetArticleBySlugData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetArticleBySlug`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getArticleBySlug, GetArticleBySlugVariables } from '@dataconnect/generated';

// The `GetArticleBySlug` query requires an argument of type `GetArticleBySlugVariables`:
const getArticleBySlugVars: GetArticleBySlugVariables = {
  slug: ..., 
};

// Call the `getArticleBySlug()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getArticleBySlug(getArticleBySlugVars);
// Variables can be defined inline as well.
const { data } = await getArticleBySlug({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getArticleBySlug(dataConnect, getArticleBySlugVars);

console.log(data.article);

// Or, you can use the `Promise` API.
getArticleBySlug(getArticleBySlugVars).then((response) => {
  const data = response.data;
  console.log(data.article);
});
```

### Using `GetArticleBySlug`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getArticleBySlugRef, GetArticleBySlugVariables } from '@dataconnect/generated';

// The `GetArticleBySlug` query requires an argument of type `GetArticleBySlugVariables`:
const getArticleBySlugVars: GetArticleBySlugVariables = {
  slug: ..., 
};

// Call the `getArticleBySlugRef()` function to get a reference to the query.
const ref = getArticleBySlugRef(getArticleBySlugVars);
// Variables can be defined inline as well.
const ref = getArticleBySlugRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getArticleBySlugRef(dataConnect, getArticleBySlugVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.article);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.article);
});
```

## GetRevisionsByArticle
You can execute the `GetRevisionsByArticle` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRevisionsByArticle(vars: GetRevisionsByArticleVariables, options?: ExecuteQueryOptions): QueryPromise<GetRevisionsByArticleData, GetRevisionsByArticleVariables>;

interface GetRevisionsByArticleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetRevisionsByArticleVariables): QueryRef<GetRevisionsByArticleData, GetRevisionsByArticleVariables>;
}
export const getRevisionsByArticleRef: GetRevisionsByArticleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRevisionsByArticle(dc: DataConnect, vars: GetRevisionsByArticleVariables, options?: ExecuteQueryOptions): QueryPromise<GetRevisionsByArticleData, GetRevisionsByArticleVariables>;

interface GetRevisionsByArticleRef {
  ...
  (dc: DataConnect, vars: GetRevisionsByArticleVariables): QueryRef<GetRevisionsByArticleData, GetRevisionsByArticleVariables>;
}
export const getRevisionsByArticleRef: GetRevisionsByArticleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRevisionsByArticleRef:
```typescript
const name = getRevisionsByArticleRef.operationName;
console.log(name);
```

### Variables
The `GetRevisionsByArticle` query requires an argument of type `GetRevisionsByArticleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetRevisionsByArticleVariables {
  articleId: UUIDString;
}
```
### Return Type
Recall that executing the `GetRevisionsByArticle` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRevisionsByArticleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRevisionsByArticleData {
  revisions: ({
    id: UUIDString;
    savedAt: TimestampString;
    savedBy: {
      id: string;
      email: string;
    } & User_Key;
  } & Revision_Key)[];
}
```
### Using `GetRevisionsByArticle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRevisionsByArticle, GetRevisionsByArticleVariables } from '@dataconnect/generated';

// The `GetRevisionsByArticle` query requires an argument of type `GetRevisionsByArticleVariables`:
const getRevisionsByArticleVars: GetRevisionsByArticleVariables = {
  articleId: ..., 
};

// Call the `getRevisionsByArticle()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRevisionsByArticle(getRevisionsByArticleVars);
// Variables can be defined inline as well.
const { data } = await getRevisionsByArticle({ articleId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRevisionsByArticle(dataConnect, getRevisionsByArticleVars);

console.log(data.revisions);

// Or, you can use the `Promise` API.
getRevisionsByArticle(getRevisionsByArticleVars).then((response) => {
  const data = response.data;
  console.log(data.revisions);
});
```

### Using `GetRevisionsByArticle`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRevisionsByArticleRef, GetRevisionsByArticleVariables } from '@dataconnect/generated';

// The `GetRevisionsByArticle` query requires an argument of type `GetRevisionsByArticleVariables`:
const getRevisionsByArticleVars: GetRevisionsByArticleVariables = {
  articleId: ..., 
};

// Call the `getRevisionsByArticleRef()` function to get a reference to the query.
const ref = getRevisionsByArticleRef(getRevisionsByArticleVars);
// Variables can be defined inline as well.
const ref = getRevisionsByArticleRef({ articleId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRevisionsByArticleRef(dataConnect, getRevisionsByArticleVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.revisions);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.revisions);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `pew-pew-connector` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertArticle
You can execute the `UpsertArticle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertArticle(vars: UpsertArticleVariables): MutationPromise<UpsertArticleData, UpsertArticleVariables>;

interface UpsertArticleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertArticleVariables): MutationRef<UpsertArticleData, UpsertArticleVariables>;
}
export const upsertArticleRef: UpsertArticleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertArticle(dc: DataConnect, vars: UpsertArticleVariables): MutationPromise<UpsertArticleData, UpsertArticleVariables>;

interface UpsertArticleRef {
  ...
  (dc: DataConnect, vars: UpsertArticleVariables): MutationRef<UpsertArticleData, UpsertArticleVariables>;
}
export const upsertArticleRef: UpsertArticleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertArticleRef:
```typescript
const name = upsertArticleRef.operationName;
console.log(name);
```

### Variables
The `UpsertArticle` mutation requires an argument of type `UpsertArticleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertArticleVariables {
  id?: UUIDString | null;
  title: string;
  slug: string;
  content: unknown;
  categoryId: UUIDString;
  isPublished?: boolean | null;
}
```
### Return Type
Recall that executing the `UpsertArticle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertArticleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertArticleData {
  article_upsert: Article_Key;
}
```
### Using `UpsertArticle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertArticle, UpsertArticleVariables } from '@dataconnect/generated';

// The `UpsertArticle` mutation requires an argument of type `UpsertArticleVariables`:
const upsertArticleVars: UpsertArticleVariables = {
  id: ..., // optional
  title: ..., 
  slug: ..., 
  content: ..., 
  categoryId: ..., 
  isPublished: ..., // optional
};

// Call the `upsertArticle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertArticle(upsertArticleVars);
// Variables can be defined inline as well.
const { data } = await upsertArticle({ id: ..., title: ..., slug: ..., content: ..., categoryId: ..., isPublished: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertArticle(dataConnect, upsertArticleVars);

console.log(data.article_upsert);

// Or, you can use the `Promise` API.
upsertArticle(upsertArticleVars).then((response) => {
  const data = response.data;
  console.log(data.article_upsert);
});
```

### Using `UpsertArticle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertArticleRef, UpsertArticleVariables } from '@dataconnect/generated';

// The `UpsertArticle` mutation requires an argument of type `UpsertArticleVariables`:
const upsertArticleVars: UpsertArticleVariables = {
  id: ..., // optional
  title: ..., 
  slug: ..., 
  content: ..., 
  categoryId: ..., 
  isPublished: ..., // optional
};

// Call the `upsertArticleRef()` function to get a reference to the mutation.
const ref = upsertArticleRef(upsertArticleVars);
// Variables can be defined inline as well.
const ref = upsertArticleRef({ id: ..., title: ..., slug: ..., content: ..., categoryId: ..., isPublished: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertArticleRef(dataConnect, upsertArticleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.article_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.article_upsert);
});
```

## UpdateArticle
You can execute the `UpdateArticle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateArticle(vars: UpdateArticleVariables): MutationPromise<UpdateArticleData, UpdateArticleVariables>;

interface UpdateArticleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateArticleVariables): MutationRef<UpdateArticleData, UpdateArticleVariables>;
}
export const updateArticleRef: UpdateArticleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateArticle(dc: DataConnect, vars: UpdateArticleVariables): MutationPromise<UpdateArticleData, UpdateArticleVariables>;

interface UpdateArticleRef {
  ...
  (dc: DataConnect, vars: UpdateArticleVariables): MutationRef<UpdateArticleData, UpdateArticleVariables>;
}
export const updateArticleRef: UpdateArticleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateArticleRef:
```typescript
const name = updateArticleRef.operationName;
console.log(name);
```

### Variables
The `UpdateArticle` mutation requires an argument of type `UpdateArticleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateArticleVariables {
  id: UUIDString;
  title: string;
  slug: string;
  content: unknown;
  categoryId: UUIDString;
  isPublished?: boolean | null;
}
```
### Return Type
Recall that executing the `UpdateArticle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateArticleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateArticleData {
  article_update?: Article_Key | null;
}
```
### Using `UpdateArticle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateArticle, UpdateArticleVariables } from '@dataconnect/generated';

// The `UpdateArticle` mutation requires an argument of type `UpdateArticleVariables`:
const updateArticleVars: UpdateArticleVariables = {
  id: ..., 
  title: ..., 
  slug: ..., 
  content: ..., 
  categoryId: ..., 
  isPublished: ..., // optional
};

// Call the `updateArticle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateArticle(updateArticleVars);
// Variables can be defined inline as well.
const { data } = await updateArticle({ id: ..., title: ..., slug: ..., content: ..., categoryId: ..., isPublished: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateArticle(dataConnect, updateArticleVars);

console.log(data.article_update);

// Or, you can use the `Promise` API.
updateArticle(updateArticleVars).then((response) => {
  const data = response.data;
  console.log(data.article_update);
});
```

### Using `UpdateArticle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateArticleRef, UpdateArticleVariables } from '@dataconnect/generated';

// The `UpdateArticle` mutation requires an argument of type `UpdateArticleVariables`:
const updateArticleVars: UpdateArticleVariables = {
  id: ..., 
  title: ..., 
  slug: ..., 
  content: ..., 
  categoryId: ..., 
  isPublished: ..., // optional
};

// Call the `updateArticleRef()` function to get a reference to the mutation.
const ref = updateArticleRef(updateArticleVars);
// Variables can be defined inline as well.
const ref = updateArticleRef({ id: ..., title: ..., slug: ..., content: ..., categoryId: ..., isPublished: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateArticleRef(dataConnect, updateArticleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.article_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.article_update);
});
```

## DeleteArticle
You can execute the `DeleteArticle` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteArticle(vars: DeleteArticleVariables): MutationPromise<DeleteArticleData, DeleteArticleVariables>;

interface DeleteArticleRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteArticleVariables): MutationRef<DeleteArticleData, DeleteArticleVariables>;
}
export const deleteArticleRef: DeleteArticleRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteArticle(dc: DataConnect, vars: DeleteArticleVariables): MutationPromise<DeleteArticleData, DeleteArticleVariables>;

interface DeleteArticleRef {
  ...
  (dc: DataConnect, vars: DeleteArticleVariables): MutationRef<DeleteArticleData, DeleteArticleVariables>;
}
export const deleteArticleRef: DeleteArticleRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteArticleRef:
```typescript
const name = deleteArticleRef.operationName;
console.log(name);
```

### Variables
The `DeleteArticle` mutation requires an argument of type `DeleteArticleVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteArticleVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteArticle` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteArticleData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteArticleData {
  article_delete?: Article_Key | null;
}
```
### Using `DeleteArticle`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteArticle, DeleteArticleVariables } from '@dataconnect/generated';

// The `DeleteArticle` mutation requires an argument of type `DeleteArticleVariables`:
const deleteArticleVars: DeleteArticleVariables = {
  id: ..., 
};

// Call the `deleteArticle()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteArticle(deleteArticleVars);
// Variables can be defined inline as well.
const { data } = await deleteArticle({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteArticle(dataConnect, deleteArticleVars);

console.log(data.article_delete);

// Or, you can use the `Promise` API.
deleteArticle(deleteArticleVars).then((response) => {
  const data = response.data;
  console.log(data.article_delete);
});
```

### Using `DeleteArticle`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteArticleRef, DeleteArticleVariables } from '@dataconnect/generated';

// The `DeleteArticle` mutation requires an argument of type `DeleteArticleVariables`:
const deleteArticleVars: DeleteArticleVariables = {
  id: ..., 
};

// Call the `deleteArticleRef()` function to get a reference to the mutation.
const ref = deleteArticleRef(deleteArticleVars);
// Variables can be defined inline as well.
const ref = deleteArticleRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteArticleRef(dataConnect, deleteArticleVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.article_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.article_delete);
});
```

## CreateRevision
You can execute the `CreateRevision` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRevision(vars: CreateRevisionVariables): MutationPromise<CreateRevisionData, CreateRevisionVariables>;

interface CreateRevisionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRevisionVariables): MutationRef<CreateRevisionData, CreateRevisionVariables>;
}
export const createRevisionRef: CreateRevisionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRevision(dc: DataConnect, vars: CreateRevisionVariables): MutationPromise<CreateRevisionData, CreateRevisionVariables>;

interface CreateRevisionRef {
  ...
  (dc: DataConnect, vars: CreateRevisionVariables): MutationRef<CreateRevisionData, CreateRevisionVariables>;
}
export const createRevisionRef: CreateRevisionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRevisionRef:
```typescript
const name = createRevisionRef.operationName;
console.log(name);
```

### Variables
The `CreateRevision` mutation requires an argument of type `CreateRevisionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateRevisionVariables {
  articleId: UUIDString;
  content: unknown;
}
```
### Return Type
Recall that executing the `CreateRevision` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRevisionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRevisionData {
  revision_insert: Revision_Key;
}
```
### Using `CreateRevision`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRevision, CreateRevisionVariables } from '@dataconnect/generated';

// The `CreateRevision` mutation requires an argument of type `CreateRevisionVariables`:
const createRevisionVars: CreateRevisionVariables = {
  articleId: ..., 
  content: ..., 
};

// Call the `createRevision()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRevision(createRevisionVars);
// Variables can be defined inline as well.
const { data } = await createRevision({ articleId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRevision(dataConnect, createRevisionVars);

console.log(data.revision_insert);

// Or, you can use the `Promise` API.
createRevision(createRevisionVars).then((response) => {
  const data = response.data;
  console.log(data.revision_insert);
});
```

### Using `CreateRevision`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRevisionRef, CreateRevisionVariables } from '@dataconnect/generated';

// The `CreateRevision` mutation requires an argument of type `CreateRevisionVariables`:
const createRevisionVars: CreateRevisionVariables = {
  articleId: ..., 
  content: ..., 
};

// Call the `createRevisionRef()` function to get a reference to the mutation.
const ref = createRevisionRef(createRevisionVars);
// Variables can be defined inline as well.
const ref = createRevisionRef({ articleId: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRevisionRef(dataConnect, createRevisionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.revision_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.revision_insert);
});
```

## UpsertCategory
You can execute the `UpsertCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertCategory(vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface UpsertCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
}
export const upsertCategoryRef: UpsertCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertCategory(dc: DataConnect, vars: UpsertCategoryVariables): MutationPromise<UpsertCategoryData, UpsertCategoryVariables>;

interface UpsertCategoryRef {
  ...
  (dc: DataConnect, vars: UpsertCategoryVariables): MutationRef<UpsertCategoryData, UpsertCategoryVariables>;
}
export const upsertCategoryRef: UpsertCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertCategoryRef:
```typescript
const name = upsertCategoryRef.operationName;
console.log(name);
```

### Variables
The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertCategoryVariables {
  id?: UUIDString | null;
  name: string;
  description?: string | null;
  parentId?: UUIDString | null;
}
```
### Return Type
Recall that executing the `UpsertCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertCategoryData {
  category_upsert: Category_Key;
}
```
### Using `UpsertCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertCategory, UpsertCategoryVariables } from '@dataconnect/generated';

// The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`:
const upsertCategoryVars: UpsertCategoryVariables = {
  id: ..., // optional
  name: ..., 
  description: ..., // optional
  parentId: ..., // optional
};

// Call the `upsertCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertCategory(upsertCategoryVars);
// Variables can be defined inline as well.
const { data } = await upsertCategory({ id: ..., name: ..., description: ..., parentId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertCategory(dataConnect, upsertCategoryVars);

console.log(data.category_upsert);

// Or, you can use the `Promise` API.
upsertCategory(upsertCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.category_upsert);
});
```

### Using `UpsertCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertCategoryRef, UpsertCategoryVariables } from '@dataconnect/generated';

// The `UpsertCategory` mutation requires an argument of type `UpsertCategoryVariables`:
const upsertCategoryVars: UpsertCategoryVariables = {
  id: ..., // optional
  name: ..., 
  description: ..., // optional
  parentId: ..., // optional
};

// Call the `upsertCategoryRef()` function to get a reference to the mutation.
const ref = upsertCategoryRef(upsertCategoryVars);
// Variables can be defined inline as well.
const ref = upsertCategoryRef({ id: ..., name: ..., description: ..., parentId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertCategoryRef(dataConnect, upsertCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_upsert);
});
```

## DeleteCategory
You can execute the `DeleteCategory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteCategory(vars: DeleteCategoryVariables): MutationPromise<DeleteCategoryData, DeleteCategoryVariables>;

interface DeleteCategoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteCategoryVariables): MutationRef<DeleteCategoryData, DeleteCategoryVariables>;
}
export const deleteCategoryRef: DeleteCategoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteCategory(dc: DataConnect, vars: DeleteCategoryVariables): MutationPromise<DeleteCategoryData, DeleteCategoryVariables>;

interface DeleteCategoryRef {
  ...
  (dc: DataConnect, vars: DeleteCategoryVariables): MutationRef<DeleteCategoryData, DeleteCategoryVariables>;
}
export const deleteCategoryRef: DeleteCategoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteCategoryRef:
```typescript
const name = deleteCategoryRef.operationName;
console.log(name);
```

### Variables
The `DeleteCategory` mutation requires an argument of type `DeleteCategoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteCategoryVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteCategory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteCategoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteCategoryData {
  category_delete?: Category_Key | null;
}
```
### Using `DeleteCategory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteCategory, DeleteCategoryVariables } from '@dataconnect/generated';

// The `DeleteCategory` mutation requires an argument of type `DeleteCategoryVariables`:
const deleteCategoryVars: DeleteCategoryVariables = {
  id: ..., 
};

// Call the `deleteCategory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteCategory(deleteCategoryVars);
// Variables can be defined inline as well.
const { data } = await deleteCategory({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteCategory(dataConnect, deleteCategoryVars);

console.log(data.category_delete);

// Or, you can use the `Promise` API.
deleteCategory(deleteCategoryVars).then((response) => {
  const data = response.data;
  console.log(data.category_delete);
});
```

### Using `DeleteCategory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteCategoryRef, DeleteCategoryVariables } from '@dataconnect/generated';

// The `DeleteCategory` mutation requires an argument of type `DeleteCategoryVariables`:
const deleteCategoryVars: DeleteCategoryVariables = {
  id: ..., 
};

// Call the `deleteCategoryRef()` function to get a reference to the mutation.
const ref = deleteCategoryRef(deleteCategoryVars);
// Variables can be defined inline as well.
const ref = deleteCategoryRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteCategoryRef(dataConnect, deleteCategoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.category_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.category_delete);
});
```

## UpsertUser
You can execute the `UpsertUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertUser(vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertUser(dc: DataConnect, vars: UpsertUserVariables): MutationPromise<UpsertUserData, UpsertUserVariables>;

interface UpsertUserRef {
  ...
  (dc: DataConnect, vars: UpsertUserVariables): MutationRef<UpsertUserData, UpsertUserVariables>;
}
export const upsertUserRef: UpsertUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertUserRef:
```typescript
const name = upsertUserRef.operationName;
console.log(name);
```

### Variables
The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertUserVariables {
  email: string;
}
```
### Return Type
Recall that executing the `UpsertUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertUserData {
  user_upsert: User_Key;
}
```
### Using `UpsertUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertUser, UpsertUserVariables } from '@dataconnect/generated';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  email: ..., 
};

// Call the `upsertUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertUser(upsertUserVars);
// Variables can be defined inline as well.
const { data } = await upsertUser({ email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertUser(dataConnect, upsertUserVars);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
upsertUser(upsertUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

### Using `UpsertUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertUserRef, UpsertUserVariables } from '@dataconnect/generated';

// The `UpsertUser` mutation requires an argument of type `UpsertUserVariables`:
const upsertUserVars: UpsertUserVariables = {
  email: ..., 
};

// Call the `upsertUserRef()` function to get a reference to the mutation.
const ref = upsertUserRef(upsertUserVars);
// Variables can be defined inline as well.
const ref = upsertUserRef({ email: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertUserRef(dataConnect, upsertUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_upsert);
});
```

