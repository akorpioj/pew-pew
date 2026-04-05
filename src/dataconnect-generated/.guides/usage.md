# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { upsertArticle, getCategoryTree, getArticlesByCategory, getArticleBySlug } from '@dataconnect/generated';


// Operation UpsertArticle:  For variables, look at type UpsertArticleVars in ../index.d.ts
const { data } = await UpsertArticle(dataConnect, upsertArticleVars);

// Operation GetCategoryTree: 
const { data } = await GetCategoryTree(dataConnect);

// Operation GetArticlesByCategory:  For variables, look at type GetArticlesByCategoryVars in ../index.d.ts
const { data } = await GetArticlesByCategory(dataConnect, getArticlesByCategoryVars);

// Operation GetArticleBySlug:  For variables, look at type GetArticleBySlugVars in ../index.d.ts
const { data } = await GetArticleBySlug(dataConnect, getArticleBySlugVars);


```