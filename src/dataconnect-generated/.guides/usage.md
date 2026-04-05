# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getCategoryTree, getArticlesByCategory, getArticleBySlug, getRevisionsByArticle, upsertArticle, updateArticle, deleteArticle, createRevision, upsertCategory, deleteCategory } from '@dataconnect/generated';


// Operation GetCategoryTree: 
const { data } = await GetCategoryTree(dataConnect);

// Operation GetArticlesByCategory:  For variables, look at type GetArticlesByCategoryVars in ../index.d.ts
const { data } = await GetArticlesByCategory(dataConnect, getArticlesByCategoryVars);

// Operation GetArticleBySlug:  For variables, look at type GetArticleBySlugVars in ../index.d.ts
const { data } = await GetArticleBySlug(dataConnect, getArticleBySlugVars);

// Operation GetRevisionsByArticle:  For variables, look at type GetRevisionsByArticleVars in ../index.d.ts
const { data } = await GetRevisionsByArticle(dataConnect, getRevisionsByArticleVars);

// Operation UpsertArticle:  For variables, look at type UpsertArticleVars in ../index.d.ts
const { data } = await UpsertArticle(dataConnect, upsertArticleVars);

// Operation UpdateArticle:  For variables, look at type UpdateArticleVars in ../index.d.ts
const { data } = await UpdateArticle(dataConnect, updateArticleVars);

// Operation DeleteArticle:  For variables, look at type DeleteArticleVars in ../index.d.ts
const { data } = await DeleteArticle(dataConnect, deleteArticleVars);

// Operation CreateRevision:  For variables, look at type CreateRevisionVars in ../index.d.ts
const { data } = await CreateRevision(dataConnect, createRevisionVars);

// Operation UpsertCategory:  For variables, look at type UpsertCategoryVars in ../index.d.ts
const { data } = await UpsertCategory(dataConnect, upsertCategoryVars);

// Operation DeleteCategory:  For variables, look at type DeleteCategoryVars in ../index.d.ts
const { data } = await DeleteCategory(dataConnect, deleteCategoryVars);


```