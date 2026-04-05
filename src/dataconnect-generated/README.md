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
- [**Mutations**](#mutations)
  - [*UpsertArticle*](#upsertarticle)

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

