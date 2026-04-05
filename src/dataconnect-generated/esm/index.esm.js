import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'pew-pew-connector',
  service: 'pew-pew',
  location: 'europe-north1'
};
export const upsertArticleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertArticle', inputVars);
}
upsertArticleRef.operationName = 'UpsertArticle';

export function upsertArticle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertArticleRef(dcInstance, inputVars));
}

export const getCategoryTreeRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCategoryTree');
}
getCategoryTreeRef.operationName = 'GetCategoryTree';

export function getCategoryTree(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCategoryTreeRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getArticlesByCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetArticlesByCategory', inputVars);
}
getArticlesByCategoryRef.operationName = 'GetArticlesByCategory';

export function getArticlesByCategory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getArticlesByCategoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getArticleBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetArticleBySlug', inputVars);
}
getArticleBySlugRef.operationName = 'GetArticleBySlug';

export function getArticleBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getArticleBySlugRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

