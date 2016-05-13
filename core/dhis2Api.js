/*
 * 
 * Core Module for using WebApi of dhis2
 * It is the persistence in the FrontEnd
 * 
 * */
var Dhis2Api = angular.module("Dhis2Api", ['ngResource']);

var urlApi = "../../../api/";
var urlBase = "../../../";

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

//Returns the  programstage by program
Dhis2Api.factory("ProgramStageByProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programs/:program.json?", 
	{
		program:'@program',
		fields:'[programStages]'
	},
  { get: { method: "GET"} });
}]);

//Returns the programStageDataElements by programstage
Dhis2Api.factory("ProgramStageDataElementsByProgramStage",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programStages/:programStage.json?", 
	{
		programStage:'@programStage',
		fields:'id,programStageDataElements[id]'
	},
  { get: { method: "GET"} });
}]);

//Returns the  programStageSections by programstage
Dhis2Api.factory("ProgramStageDataElementsByProgramStageSection",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programStageSections/:programStageSection.json?", 
	{
		programStageSection:'@programStageSection',
		fields:'id,programStageDataElements[id]'
	},
  { get: { method: "GET"} });
}]);


//Returns the programStageDataElements DataElements
Dhis2Api.factory("DataElementsByProgramStageDataElements",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programStageDataElements/:programStageDataElement.json?", 
	{
		programStageDataElement:'@programStageDataElement',
		fields:'id,dataElement[id,name,attributeValues,optionSet]'
	},
  { get: { method: "GET"} });
}]);

//Update the provided datavalues
Dhis2Api.factory("UpdateEvent",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"events/", 
	{
	},
  { post: { method: "POST"} });
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