const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'pew-pew-connector',
  service: 'pew-pew',
  location: 'europe-north1'
};
exports.connectorConfig = connectorConfig;

const upsertArticleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertArticle', inputVars);
}
upsertArticleRef.operationName = 'UpsertArticle';
exports.upsertArticleRef = upsertArticleRef;

exports.upsertArticle = function upsertArticle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertArticleRef(dcInstance, inputVars));
}
;

const getCategoryTreeRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCategoryTree');
}
getCategoryTreeRef.operationName = 'GetCategoryTree';
exports.getCategoryTreeRef = getCategoryTreeRef;

exports.getCategoryTree = function getCategoryTree(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getCategoryTreeRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getArticlesByCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetArticlesByCategory', inputVars);
}
getArticlesByCategoryRef.operationName = 'GetArticlesByCategory';
exports.getArticlesByCategoryRef = getArticlesByCategoryRef;

exports.getArticlesByCategory = function getArticlesByCategory(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getArticlesByCategoryRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getArticleBySlugRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetArticleBySlug', inputVars);
}
getArticleBySlugRef.operationName = 'GetArticleBySlug';
exports.getArticleBySlugRef = getArticleBySlugRef;

exports.getArticleBySlug = function getArticleBySlug(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getArticleBySlugRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
