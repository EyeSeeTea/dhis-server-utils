/*
 * 
 * Core Module for using WebApi of dhis2
 * It is the persistence in the FrontEnd
 * 
 * */
var Dhis2Api = angular.module("Dhis2Api", ['ngResource']);

var urlApi = "http://192.168.55.101:8080/api/";
var urlBase = "http://192.168.55.101:8080/";

//Create all common variables of the apps 
Dhis2Api.factory("commonvariable", function () {
	var Vari={
			url: urlApi,
			urlbase: urlBase,
			OrganisationUnitList:[]
			};

   return Vari; 
});

Dhis2Api.constant("urlApi", urlApi);

Dhis2Api.factory("userAuthorization", ['$resource','commonvariable',function($resource,commonvariable) {
	return $resource(commonvariable.url + "me/authorization/:menuoption",
		{
			menuoption:'@menuoption'
		},
		{ get: { method: "GET", transformResponse: function (response) {return {status: response};}	}});

}]);

Dhis2Api.factory("TreeOrganisationunit",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource(commonvariable.url+"organisationUnits/:uid", 
   {
	uid:'@uid',
    fields:'name,id,level,children[name,id,level]'
   }, 
  { get: { method: "GET"} });
}]);

//Returns the uid pograms list
Dhis2Api.factory("ProgramsList",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programs.json", 
	{
		fields:'id,programStages[id]'
	},
  { get: { method: "GET"} });
}]);

//Returns the program uid from a program uid(Used to checks if the program exists).
Dhis2Api.factory("CheckProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programs/:uid.json", 
	{
		uid:'@uid',
		fields:'id,programStages[id]'
	},
  { get: { method: "GET"} });
}]);

//Returns the events uid in a program
Dhis2Api.factory("EventsByProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"events.json?program=:program", 
	{
		program:'@program',
		startDate:'@startDate',
		endDate:'@endDate',
		totalPages:'true',
		pageSize:'75',
		skipMeta:'true',
		page:'@page'
	},
  { get: { method: "GET"} });
}]);

//Returns the attributes from a dataElement
Dhis2Api.factory("DataElementAttributes",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"dataElements/:uid.json?", 
	{
		uid:'@uid',
		fields:'[id,attributeValues]'
	},
  { get: { method: "GET"} });
}]);


//Returns the program dataelements
Dhis2Api.factory("DataElementsByProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"dataElements.json?", 
	{
		program:'@program',
		page:'@page',
		pageSize:'500',
		fields:'[id,attributeValues]'
	},
  { get: { method: "GET"} });
}]);

//Returns the program programstage
Dhis2Api.factory("ProgramStageByProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programs/:program.json?", 
	{
		program:'@program',
		fields:'[programStages]'
	},
  { get: { method: "GET"} });
}]);

//Returns the programstage programStageDataElements
Dhis2Api.factory("ProgramStageDataElementsByProgramStage",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programStages/:programStage.json?", 
	{
		programStage:'@programStage',
		fields:'id,programStageDataElements[id]'
	},
  { get: { method: "GET"} });
}]);

//Returns the programStageDataElements DataElements
Dhis2Api.factory("DataElementsByProgramStageDataElements",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programStageDataElements/:programStageDataElement.json?", 
	{
		programStageDataElement:'@programStageDataElement',
		fields:'id,dataElement[id,attributeValues,optionSet]'
	},
  { get: { method: "GET"} });
}]);

//Returns the options from optionUid DataElements
Dhis2Api.factory("OptionsByOptionUid",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"optionSets/:optionSet.json?", 
	{
		optionSet:'@optionSet',
		fields:'[id,options]'
	},
  { get: { method: "GET"} });
}]);

//Returns the optionsSets
Dhis2Api.factory("OptionsSets",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"optionSets/", 
	{
		fields:'[:all,!created,!lastUpdated,!href,!publicAccess,!displayName,!version,!externalAccess,!access,!userGroupAccesses,!user]',
		paging:'false'
	},
  { get: { method: "GET"} });
}]);