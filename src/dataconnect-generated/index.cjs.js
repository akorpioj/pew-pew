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

const updateArticleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateArticle', inputVars);
}
updateArticleRef.operationName = 'UpdateArticle';
exports.updateArticleRef = updateArticleRef;

exports.updateArticle = function updateArticle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateArticleRef(dcInstance, inputVars));
}
;

const deleteArticleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteArticle', inputVars);
}
deleteArticleRef.operationName = 'DeleteArticle';
exports.deleteArticleRef = deleteArticleRef;

exports.deleteArticle = function deleteArticle(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteArticleRef(dcInstance, inputVars));
}
;

const createRevisionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRevision', inputVars);
}
createRevisionRef.operationName = 'CreateRevision';
exports.createRevisionRef = createRevisionRef;

exports.createRevision = function createRevision(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createRevisionRef(dcInstance, inputVars));
}
;

const upsertCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertCategory', inputVars);
}
upsertCategoryRef.operationName = 'UpsertCategory';
exports.upsertCategoryRef = upsertCategoryRef;

exports.upsertCategory = function upsertCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertCategoryRef(dcInstance, inputVars));
}
;

const deleteCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteCategory', inputVars);
}
deleteCategoryRef.operationName = 'DeleteCategory';
exports.deleteCategoryRef = deleteCategoryRef;

exports.deleteCategory = function deleteCategory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteCategoryRef(dcInstance, inputVars));
}
;

const upsertUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertUser', inputVars);
}
upsertUserRef.operationName = 'UpsertUser';
exports.upsertUserRef = upsertUserRef;

exports.upsertUser = function upsertUser(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertUserRef(dcInstance, inputVars));
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

const getRevisionsByArticleRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetRevisionsByArticle', inputVars);
}
getRevisionsByArticleRef.operationName = 'GetRevisionsByArticle';
exports.getRevisionsByArticleRef = getRevisionsByArticleRef;

exports.getRevisionsByArticle = function getRevisionsByArticle(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getRevisionsByArticleRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
