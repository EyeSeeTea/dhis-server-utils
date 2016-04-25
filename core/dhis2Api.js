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
    fields:'id'
	},
  { get: { method: "GET"} });
}]);

//Returns the program uid from a program uid(Used to checks if the program exists).
Dhis2Api.factory("CheckProgram",['$resource','commonvariable', function ($resource,commonvariable) {
	return $resource( commonvariable.url+"programs/:uid", 
	{
		uid:'@uid',
		fields:'id'
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
		page:'@page'
	},
  { get: { method: "GET"} });
}]);
