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

dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'DataElementAttributes', 'DataElementsByProgram', 'ProgramStageDataElementsByProgramStage', 'DataElementsByProgramStageDataElements', 'OptionsSets', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, DataElementAttributes, DataElementsByProgram, ProgramStageDataElementsByProgramStage, DataElementsByProgramStageDataElements, OptionsSets) {


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
				var SERVER_TAB_UID="HzxUdTtqy5c";


				$scope.progressbarDisplayed = true;
				$scope.progressbarDisplayed ="DOWNLOADING_EVENTS";
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
				var resultOfDataelements;
				var nextResultOfDataelements;
				var resultProgramStageDataElement;

				//List of events
				var events;
				//list of programs
				var programs=[];
				//list of programsStages
				//list of ProgramsDataElements

				//List of uids from event's dataValues
				var dataElementsUids;
				//List of Questions objects
				var questions=[];
				//List of CompositeScore objects
				var compositeScores=[];
				var metadata=[];

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
					var resultPrograms=CheckProgram.get({uid:$scope.program_uid});
				}
				
				//Get all the programs and continue program by program
				//Async result
				resultPrograms.$promise.then(function(data) {
					console.log(data.id);
					if(data.programs==undefined && data.id==undefined)
						$scope.loginError=true;
					else{
						pullOptionSets();
						$scope.loginError=false;
						if(data.programs!=undefined){
							totalPrograms=data.programs.length;
							console.log(totalPrograms);
							console.log(data);
							if(totalPrograms>0){
								for(var i=0;i<data.programs.length;i++){
									downloadProgram(data.program[i]);
								}
							}
						}
						else if(data.id==$scope.program_uid){
							totalPrograms=1;
							downloadProgram(data)
						}
					}
				},function(){$scope.invalidProgram=true;});
				
				function downloadProgram(program){
					downloadMetadataByProgram(program);
					downloadEventsByProgram(program.id,start_date,end_date);
				}

				//Retrireve all programs metadata
				function downloadMetadataByProgram(data){
					var program=data;
					//save programStages
					for(var i=0;i<program.programStages.length;i++){
						var programStage= new Object();
						programStage.id=program.programStages[i].id;
						if(program.programStages.programStage==undefined){
							program.programStages=[];

						}
						program.programStages.push(programStage);
					}
					//Save program in global programs variable
					programs.push(program);
					//continue downloading the metadata
					downloadMetadataByProgramStage(program);					
				}

				function saveProgramStageDataElements(data){
					//Save the programStageDataelements in the correct program->programStage
					var programStageDataElements=data.programStageDataElements;
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].id==data.id){
								programs[i].programStages[d].programStageDataElements=(data.programStageDataElements);
							}
						}
					}
				}

				function saveDataElementsFromProgramStageDataElements(data){
					for(var i = 0; i<programs.length;i++){
						for(var d = 0; d<programs[i].programStages.length;d++){
							for(var x = 0; x<programs[i].programStages[d].programStageDataElements.length;x++){
								if(programs[i].programStages[d].programStageDataElements[x].id==data.id){
									//Save the dataelement in the same level as programStageDataElements.
									if(programs[i].programStages[d].dataElements==undefined){
										programs[i].programStages[d].dataElements=[];
									}
									programs[i].programStages[d].dataElements.push(data.dataElement);
								}
							}
						}
					}
				}


				//handler
				var resultProgramStage;
				var totalProgramStages=0;
				//Retrireve all programsStage metadata
				function downloadMetadataByProgramStage(){
					console.log(totalProgramStages);
					donwloadedProgramStage=0;
					
					//Count to control the async download
					//the programs is async object... maybe it could be wrong.
					for(var i=0;i<programs.length;i++){
						totalProgramStages+=programs[i].programStages.length;
					}

					//download each programStage 
					for(var d=0;d<programs.length;d++){
						//programStages
						for(var i=0;i<programs[d].programStages.length;i++){
							//Returns the programStageDataElements from the ProgramStages
							resultProgramStage=ProgramStageDataElementsByProgramStage.get({programStage:programs[d].programStages[i].id});	
							resultProgramStage.$promise.then(function(data) {
								//save the dataelements in the program/programstages/questions /program/programstages/compositeScores
								saveProgramStageDataElements(data);
								donwloadedProgramStage++;
								console.log("TotalProgramStages: "+totalProgramStages +" Downloaded program stages: " +donwloadedProgramStage );
								if(totalProgramStages<=donwloadedProgramStage){
									console.log("Finish programStage from every pogram");
									console.log(programs);
									downloadMetadataByProgramStageDataElement();
			 					}
							},function(){$scope.unexpectedError=true;});
						}					
					}

				}

				var totalProgramStagesDataElements=0;
				//Retrieve all programStageDataElements metadata
				function downloadMetadataByProgramStageDataElement(){

					//Count to control the async download
					//the programs is async object... maybe it could be wrong.
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							totalProgramStagesDataElements+=programs[i].programStages[d].programStageDataElements.length;
						}
					}


					downloadedProgramStageDataElement=0;
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var x=0;x<programs[i].programStages[d].programStageDataElements.length;x++){
								//Returns the DataElements from the ProgramStageDataElements
								//Fixme: we need add delay here or something;
								console.log("Downloading programStagesDataElements");
								resultProgramStageDataElement=DataElementsByProgramStageDataElements.get({programStageDataElement:programs[i].programStages[d].programStageDataElements[x].id});	
								resultProgramStageDataElement.$promise.then(function(data) {
								saveDataElementsFromProgramStageDataElements(data);
								downloadedProgramStageDataElement++;
								if(totalProgramStagesDataElements<=downloadedProgramStageDataElement){
									console.log("Finish DataElements from programStageDataElement");
									//downloadDataElementsByProgramStageDataElement(programStagesDataElements,program);
									console.log(programs);
									saveDataElements();
			 					}
								},function(){$scope.unexpectedError=true;});
							}
						}
					}
				}
			var optionSet;
			var resultOptionSet;
			function pullOptionSets(){
				resultOptionSet=OptionsSets.get();	
				resultOptionSet.$promise.then(function(data) {
					optionSet=data;
					console.log(optionSet);
				},function(){$scope.unexpectedError=true;});
			}
				
			function saveDataElements(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
						for(var x = 0; x<programs[i].programStages[d].dataElements.length;x++){
							var dataElement=buildDataElement(programs[i].programStages[d].dataElements[x]);
							if(dataElement.type==QUESTION){
								if(programs[i].programStages[d].questions==undefined){
									programs[i].programStages[d].questions=[];
								}
								programs[i].programStages[d].questions.push(dataElement);
							}
							else if(dataElement.type==COMPOSITE_SCORE){
								if(programs[i].programStages[d].compositeScores==undefined){
									programs[i].programStages[d].compositeScores=[];
								}
								programs[i].programStages[d].compositeScores.push(dataElement);
							}
						}
					}
				}
				console.log(programs);
			}


			function buildDataElement(data){

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
							newElement.type=QUESTION;
						}
						else if(data.attributeValues[i].value==COMPOSITE_SCORE){
							newElement.type=COMPOSITE_SCORE;
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
					if(newElement.type==QUESTION){
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
						if(data.attributeValues[i].attribute.id==SERVER_TAB_UID){
							//not in 2.20
							newElement.tab=data.attributeValues[i].value;
						}
					}
					if(data.optionSet!=undefined){
						newElement.optionSet=data.optionSet;
					}
					if(newElement.type==COMPOSITE_SCORE){
						if(data.attributeValues[i].attribute.id==SERVER_COMPOSITESCORE_UID){
							newElement.hierarchy=data.attributeValues[i].value;
						}
					}
				}
				return newElement;
			}

			var donwloadedDataElements=0;
			function saveDataelementsold(){

				console.log("Pulling "+data.dataElements.length+" dataelements retrieving data... by program"+program.uid +" first dataelement"+data.dataElements[0].id);
				compositeScores=[];
				questions=[];
				for(var i =0; i<data.dataElements.length;i++){
					saveDataElement(data.dataElements[i]);
					donwloadedDataElements++;
					}
					console.log("All dataElements was saved");
					program.compositeScores=compositeScores;
					program.questions=questions;
					if(metadata.programs==undefined){
						metadata.programs=[];
						metadata.programs.push(program);
					}
					else{
						var existProgram=false;
						for(var i=0; i<metadata.programs.length;i++){
							if(metadata.programs[i].uid==program.uid){
								existProgram=true;
								if(metadata.programs[i].compositeScores==undefined){
									metadata.programs[i].compositeScores=compositeScores;
								}
								else{
									metadata.programs[i].compositeScores=compositeScores.concat(metadata.programs[i].compositeScores);
								}
								if(metadata.programs[i].questions==undefined){
									metadata.programs[i].questions=questions;
								}else{
									metadata.programs[i].questions=questions.concat(metadata.programs[i].questions);
								}
								break;
							}
						}
						if(existProgram==false){
							metadata.programs.push(program);
						}
					}
					console.log(metadata);

					$scope.progressbarDisplayed = false;
					return donwloadedDataElements;
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

			var programDataelementsComplete=0;
			var programDataelementDownloaded=0;
			

			//Retrieve all events and upload it.
			function downloadEventsByProgram(program, startdate, endDate){
				var page=1;
				var totalEvents=0;
				var totalPage=0;
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
								newResultEvent = EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
								newResultEvent.$promise.then(function(nextPageData) {
									console.log("first event by page"+nextPageData.events[0])
									saveEvents(nextPageData);
									if(events.length>=totalEvents){
										console.log("All events was saved");
										console.log("programs donwloaded"+programsDownloaded +" total programs"+ totalPrograms);
										if(programsDownloaded==totalPrograms){
											//pullDataElements(events);
											console.log(events);
										}
									}
								},function(){$scope.invalidProgram=true;});
							}
						}
						else{	
							//Only one page:
							saveEvents(data);
							if(events!=undefined)
							if(events.length>=totalEvents){
								console.log("All events was saved- Only one page");
								console.log(events);
								//pullDataElements(events);
							}
						}
					},function(){$scope.invalidProgram=true;});

				console.log("events by program"+eventsByProgram);
			}
			}

	
}]);
