/* 
   Copyright (c) 2016.
 
   This file is part of Project Manager.
 
   Project Manager is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
 
   Project Manager is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
 
   You should have received a copy of the GNU General Public License
   along with Project Manager.  If not, see <http://www.gnu.org/licenses/>. */

dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram) {
	
	var $translate = $filter('translate');

	$scope.openstart = function($event) {
		    $event.preventDefault();
		    $event.stopPropagation();

		    $scope.openedstart = true;
		};
	$scope.openend = function($event) {
			    $event.preventDefault();
			    $event.stopPropagation();

			    $scope.openedend = true;
			  };
			
			$scope.submit=function(){
				console.log("submit");
				
				$scope.progressbarDisplayed = true;
				$scope.invalidProgram=false;
				$scope.unexpectedError=false;
				var start_date=$filter('date')($scope.start_date,'yyyy-MM-dd');
				var end_date=$filter('date')($scope.end_date,'yyyy-MM-dd');
				console.log(start_date); 
				var resultEvent;
				var newResultEvent;
				var events;
				var eventsByProgram;
				var dataElements;
				var page=1;

				if(($scope.program_uid)==undefined || ($scope.program_uid)==""){
					//Requests all the programs or checks
					var resultPrograms=ProgramsList.get();
				}
				else{
					//Request the introduced program (to check if exists)
					var resultProgram=CheckProgram.get({uid:$scope.program_uid});
				}
				
				if(($scope.program_uid)==undefined || ($scope.program_uid)==""){
					//Get all the programs and continue program by program
					//Async result
					resultPrograms.$promise.then(function(data) {
						for(var i=0;i<data.programs.length;i++){
							uploadEventsByProgram(data.programs[i].id,start_date,end_date);
						}
					},function(){console.log("error retrieving the programs")});
				}
				else{
					//Checks if the program exist, show error or continue.
					//Async result
					resultProgram.$promise.then(function(data) {
						if(data.id == $scope.program_uid){
							$scope.invalidProgram=false;
							uploadEventsByProgram(data.id,start_date,end_date);
						}
						else
						{
							$scope.invalidProgram=true;
						}
					},function(){$scope.invalidProgram=true;});
				}

				
			function uploadEvents(resultEvent){
				console.log("uploadEvents");
			}

			function pullDataElements(events){
				console.log("Dataelements");

				for(event in events){
					for(datavalue in event.dataValues){
						if(dataElements.indexOf(datavalue.dataElement) == -1)
						{
							dataElements.push(datavalue.dataElement);
						}
					}

				}
			}

			function saveEvents(data){
				console.log("saveEvents");

				console.log("resultEvent Page: "+data.pager.page);
				if(data.events==undefined){
					$scope.unexpectedError=true;
				}
				if(events==undefined){
					events=data.events;
				}
				else{
						console.log(data.events);
						for(var i=0;i<data.events.length;i++){
							events.push(data.events[i]);
							console.log(data.events[i]);
						}
				}
			}
			
			

			//Retrieve all events and upload it.
			function uploadEventsByProgram(program, startdate, endDate){
				console.log("Upload Events by program");
				console.log(program +"fecha:" +start_date+"fecha2 " + end_date + "page" + page);
				resultEvent = EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
				resultEvent.$promise.then(function(data) {
						console.log("async result event: "+data);
						console.log("async event page: "+ data.pager.page);
						console.log(data.events[0]);
						totalPage=data.pager.pageCount;
						console.log("async event pager: "+ totalPage);
						totalEvents=data.pager.total;
						console.log("async event total: "+ totalEvents);
						while(page<totalPage){
							if(page==1)
								saveEvents(data);
							page++;
							newResultEvent =new EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
							console.log("calls:" +program +"fecha:" +start_date+"fecha2 " + end_date + "page" + page);
							newResultEvent.$promise.then(function(nextPageData) {
							console.log("data1");
							console.log(nextPageData);
							console.log("resultEvent Page: "+nextPageData.pager.page);
							saveEvents(nextPageData);
							console.log("data events count:");
							console.log(events.length);
							console.log(events.length);
							console.log(totalEvents);
							if(events.length>=totalEvents){
								console.log("All events was saved");
								console.log(events);
							}
							},function(){$scope.invalidProgram=true;});
						}
					},function(){$scope.invalidProgram=true;});

				console.log("events by program"+eventsByProgram);
			}
							$scope.progressbarDisplayed = false;
			}

	
}]);
