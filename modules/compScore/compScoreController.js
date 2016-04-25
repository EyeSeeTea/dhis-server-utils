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

dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'DataElementAttributes', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, DataElementAttributes) {
	
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
				
				var SERVER_ATTRIBUTE_UID="IMVz39TtAHM";
				var COMPOSITE_SCORE="93";
				var QUESTION="92";
				var SERVER_FACTOR_UID="DVzuBdj9kli";//Not used in 2.20/2.21
				var SERVER_NUMERATOR_UID="Zyr7rlDOJy8";
				var SERVER_DENUMERATOR_UID="l7WdLDhE3xW";
				var SERVER_COMPOSITESCORE_UID="k738RpAYLmz";
				var SERVER_HEADER_UID="olcVXnDPG1U";


				$scope.progressbarDisplayed = true;
				$scope.loginError=false;
				$scope.invalidProgram=false;
				$scope.unexpectedError=false;
				var start_date=$filter('date')($scope.start_date,'yyyy-MM-dd');
				var end_date=$filter('date')($scope.end_date,'yyyy-MM-dd');
				console.log(start_date); 
				//handlers for async calls.
				var resultEvent;
				var newResultEvent;
				var resultDataElement;
				var eventsByProgram;

				//List of events
				var events;
				//List of uids from event's dataValues
				var dataElementsUids;
				//List of dataElement objects
				var dataElements=[];
				//List of CompositeScore objects
				var compositeScores=[];

				//Count variables to control when finish the async calls. 
				var totalEvents=0;
				var totalPrograms=0;
				var programsDownloaded=0;

				//Call on presh submit:

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
						if(data.programs==undefined)
							$scope.loginError=true;
						else{
							$scope.loginError=false;
							totalPrograms=data.programs.length;
							for(var i=0;i<data.programs.length;i++){
								uploadEventsByProgram(data.programs[i].id,start_date,end_date);
							}
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



				//CompositeScore Object example
				function compositeScore(uid,hierarchy,order,parentUid,header){
					this.uid=uid;
					this.hierarchy=hierarchy;
					this.order=order;
					this.parentUid=parentUid;
					this.header=header;
				}

				//dataElement object example
				function dataElement(uid,numerator,denominator,factor,header){
					this.uid=uid;
					this.numerator=numerator;
					this.denominator=denominator;
					this.factor=factor;
					this.header=header;
				};

				
			function saveDataElement(data){
				var newElement = new Object();
				if(data.id==undefined){
					console.log("error data");
					console.log(data);
				}
				newElement.uid=data.id;
				//First loop to know if is a Composite score or a Question.
				for(var i=0;i<data.attributeValues.length;i++){
					if(data.attributeValues[i].attribute.id==SERVER_ATTRIBUTE_UID){
						if(data.attributeValues[i].value==QUESTION){
							console.log("new Question");
							newElement.isQuestion=true;
							newElement.isCompositeScore=false;	
						}
						else if(data.attributeValues[i].value==COMPOSITE_SCORE){
							newElement.isQuestion=false;
							newElement.isCompositeScore=true;	
							console.log("new CompositeScore");
						}
						else{
							console.log("Error? no question and not composite score");
							console.log(dataElement);
						}
					}
				}
				//Second loop to create the correct object
				for(var i=0;i<data.attributeValues.length;i++){
					if(data.attributeValues[i].attribute.id==SERVER_HEADER_UID){
						newElement.header=data.attributeValues[i].value;
					}
					if(newElement.isQuestion==true){
						if(data.attributeValues[i].attribute.id==SERVER_DENUMERATOR_UID){
							newElement.denumerator=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_NUMERATOR_UID){
							newElement.numerator=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_FACTOR_UID){
							//not in 2.20
							newElement.factor=data.attributeValues[i].value;
						}
					}
					if(newElement.isCompositeScore==true){
						if(data.attributeValues==SERVER_COMPOSITESCORE_UID){
							newElement.hierarchy=data.attributeValues[i].value;
						}
					}
				}

				if(newElement.isCompositeScore==true){
						compositeScores.push(newElement);
				}
				else if(newElement.isQuestion){
					dataElements.push(newElement);
				}
			}
			var donwloadedDataElements=0;

			//Download the dataelements from the event datavalues, and create compositeScore hierarchy.
			function pullDataElements(events){
				console.log("Dataelements");
				for(var d=0;d<events.length;d++){
					if(events[d].dataValues==undefined){
						console.log("event without values");
						console.log(events[d]);
					}
					else{
						for(var i=0;i<events[d].dataValues.length;i++){
							if(dataElementsUids==undefined){
								dataElementsUids=[];
								dataElementsUids.push(events[d].dataValues[i].dataElement);
							}
							else
							if(dataElementsUids.indexOf(events[d].dataValues[i].dataElement) == -1)
							{
								//The dataelement uid is pushed if not exist in the array.
								dataElementsUids.push(events[d].dataValues[i].dataElement);
							}
						}
					}
				}
				donwloadedDataElements=0;
				for(var i=0;i<dataElementsUids.length;i++){
					resultDataElement=DataElementAttributes.get({uid:dataElementsUids[i]});	
					resultDataElement.$promise.then(function(data) {
					console.log("Pulling dataelements retrieving data...");
					console.log(data);
					donwloadedDataElements++;
					console.log(donwloadedDataElements+ " de "+dataElementsUids.length);
					saveDataElement(data);
					if(dataElementsUids.length<=donwloadedDataElements){
						console.log(dataElements);
						console.log(compositeScores);
						console.log("All dataElements was saved");
						$scope.progressbarDisplayed = false;
					}
					},function(){$scope.unexpectedError=true;});
				}
			}

			//save all the events in events array.
			function saveEvents(data){
				console.log("resultEvent Page: "+data.pager.page);
				if(data.events!=undefined){
					if(events==undefined){
						events=data.events;
					}
					else{
						for(var i=0;i<data.events.length;i++){
							events.push(data.events[i]);
						}
					}
				}
			}

			//Retrieve all events and upload it.
			function uploadEventsByProgram(program, startdate, endDate){
				var page=1;
				programsDownloaded++;
				console.log("Upload Events by program");
				console.log(program +"fecha:" +start_date+"fecha2 " + end_date + "page" + page);
				resultEvent = EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
				resultEvent.$promise.then(function(data) {
						console.log("Program"+ program);
						totalPage=data.pager.pageCount;
						totalEvents+=data.pager.total;
						if(totalPage>1){
							while(page<totalPage){
								if(page==1)
									saveEvents(data);
								page++;
								//Retrieve the next pages:
								newResultEvent =new EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
								newResultEvent.$promise.then(function(nextPageData) {
									saveEvents(nextPageData);
									if(events.length>=totalEvents){
										console.log("All events was saved");
										console.log(events.length);
										console.log("programs donwloaded"+programsDownloaded +" total programs"+ totalPrograms);
										if(programsDownloaded==totalPrograms){
											pullDataElements(events);
										}
									}
								},function(){$scope.invalidProgram=true;});
							}
						}
						else{	
							saveEvents(data);
							if(events!=undefined)
							if(events.length>=totalEvents){
								console.log("All events was saved- Only one page");
								console.log(events.length);
								pullDataElements(events);
							}
						}
					},function(){$scope.invalidProgram=true;});

				console.log("events by program"+eventsByProgram);
			}
			}

	
}]);
