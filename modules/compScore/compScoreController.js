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

dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'ProgramStageDataElementsByProgramStage', 'DataElementsByProgramStageDataElements', 'PatchEvent', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, ProgramStageDataElementsByProgramStage, DataElementsByProgramStageDataElements, PatchEvent) {


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
				
				var SERVER_ATTRIBUTE_UID="IMVz39TtAHM";
				var COMPOSITE_SCORE="93";
				var QUESTION="92";
				var SERVER_FACTOR_UID="DVzuBdj9kli";//Not used in 2.20/2.21
				var SERVER_NUMERATOR_UID="Zyr7rlDOJy8";
				var SERVER_DENOMINATOR_UID="l7WdLDhE3xW";
				var SERVER_COMPOSITESCORE_UID="k738RpAYLmz";
				var SERVER_HEADER_UID="olcVXnDPG1U";
				var SERVER_TAB_UID="HzxUdTtqy5c";
				var SERVER_QUESTIONTYPE_UID="RkNBKHl7FcO";
				var CS_TOKEN=".";
				var CS_ROOT="1";


				$scope.progressbarDisplayed = true;
				$scope.progressbarDisplayed ="DOWNLOADING_EVENTS";
				$scope.loginError=false;
				$scope.invalidProgram=false;
				$scope.unexpectedError=false;
				var start_date=$filter('date')($scope.start_date,'yyyy-MM-dd');
				var end_date=$filter('date')($scope.end_date,'yyyy-MM-dd');
				//handlers for async calls.
				var resultOptionSet;
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
				
				//Count variables to control when finish the async calls. 
				var totalEvents=0;
				var totalPrograms=0;
				var programsDownloaded=0;
				var allDownloaded=0;

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
					if(data.programs==undefined && data.id==undefined)
						$scope.loginError=true;
					else{
						$scope.loginError=false;
						if(data.programs!=undefined){
							totalPrograms=data.programs.length;
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
					allDownloaded++;
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
									console.log(programs);
									saveDataElements();

									allDownloaded--;
									if(allDownloaded==0){
										preparePrograms();
									}
			 					}
								},function(){$scope.unexpectedError=true;});
							}
						}
					}
				}
				
			function saveDataElements(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
						for(var x = 0; x<programs[i].programStages[d].dataElements.length;x++){
							var dataElement=buildDataElement(programs[i].programStages[d].dataElements[x]);
							if(dataElement!=undefined){
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
							if(data.optionSet==undefined){

								var isCalculable=false;
								//if the question had numerator/denominator is a child question
								for(var d=0;d<data.attributeValues.length;d++){
									if(data.attributeValues[d].attribute.id==SERVER_NUMERATOR_UID){
										isCalculable=true;
									}
								}
								if(!isCalculable){
									return undefined;
								}
							}
							newElement.type=QUESTION;
						}
						else if(data.attributeValues[i].value==COMPOSITE_SCORE){
							newElement.type=COMPOSITE_SCORE;
						}
						else{
							console.log("Error? no question and not composite score");
							console.log(dataElement);
						}
					}
				}
					newElement.name=data.name;
				//Second loop to create the correct object
				for(var i=0;i<data.attributeValues.length;i++){

					if(data.attributeValues[i].attribute.id==SERVER_TAB_UID){
						newElement.tab=data.attributeValues[i].value;
					}
					if(data.attributeValues[i].attribute.id==SERVER_HEADER_UID){
						newElement.header=data.attributeValues[i].value;
					}
					if(newElement.type==QUESTION){
						if(data.attributeValues[i].attribute.id==SERVER_DENOMINATOR_UID){
							newElement.denominator=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_NUMERATOR_UID){
							newElement.numerator=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_FACTOR_UID){
							//not in 2.20
							newElement.factor=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_COMPOSITESCORE_UID){
							newElement.compositeScore=data.attributeValues[i].value;
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
			function getQuestionByIdAndProgram(dataElementUid,programUid){
				var question=undefined;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var x=0;x<programs[i].programStages[d].questions.length;x++){
								if(programs[i].programStages[d].questions[x].uid==dataElementUid){
									return programs[i].programStages[d].questions[x];
								}
							}		
						}			
					}
				}
				return question;
			}

			function getCompositeParent(hierarchyParent){
				var compositeScores;
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
							if(programs[i].programStages[d].compositeScores[x].hierarchy==hierarchy)
								return programs[i].programStages[d].compositeScores[x];
						}
					}
				}
				return compositeScores;
			}
			var compositeScores=[];
			function getCompositeScoreInSameLevel(hierarchyParent){
				console.log("recursive"+ hierarchyParent);
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
							var compositeScore=programs[i].programStages[d].compositeScores[x];
							var localLength=programs[i].programStages[d].compositeScores[x].hierarchy.split(CS_TOKEN);
							var parentLength=hierarchyParent.split(".");
							if(localLength-1==parentLength){
								var compositeScorechildrens=getCompositeChildrens(compositeScore.hierarchy);
								compositeScore.children=compositeScorechildrens;
								compositeScores.push(compositeScore);
							}
						}
					}
				}
				console.log("level");
				console.log(compositeScores);
				return compositeScores;
			}

			function sendEvent(event){
				var dataValues=event.updatedDataValues;
				PatchEvent.patch(event.uid,event.dataValue.dataElement,dataValues);
			}


			//Fixme the order needs be recursive, not for work only in three levels.
			function getCompositeScoreChildrens(compositeScoreParent,compositeScores){
				for(var x=0;x<compositeScores.length;x++){
					var localParent=compositeScoreParent; 
					var localHierarchy=compositeScores[x].hierarchy;
					var splitlocalHierarchy=localHierarchy.split(CS_TOKEN);
					var splitParentHierarchy=localParent.hierarchy.split(CS_TOKEN);
					//IF contains hirarchyParent(in the index 0) and have one more level is a child.
					if(splitlocalHierarchy.length-1==splitParentHierarchy.length && localHierarchy.indexOf(localParent.hierarchy)==0){
						console.log("children from "+localParent.hierarchy + " child "+ localHierarchy+"saved");
						//var compositeScorechildrens=getCompositeChildrens(compositeScore.hierarchy);
						compositeScores[x]=getCompositeScoreChildrens(compositeScores[x],compositeScores);
						if(compositeScoreParent.children==undefined){
							compositeScoreParent.children=[];
							compositeScoreParent.children.push(compositeScores[x]);
						}
						else
							compositeScoreParent.children.push(compositeScores[x]);
						}
				}
				return compositeScoreParent;
			}

			//order all compositeScore Children for each problem.
			function orderAllCompositeChildrens(){
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						//the element in orderedCompositeScores is the root and dont have new childrens
						for(var x=0;x<programs[i].programStages[d].orderedCompositeScores.children.length;x++){
							for(var y=0;y<programs[i].programStages[d].compositeScores.length;y++){
								var localParent=programs[i].programStages[d].orderedCompositeScores.children[x]; 
								var localHierarchy=programs[i].programStages[d].compositeScores[y].hierarchy; 

								var splitlocalHierarchy=localHierarchy.split(CS_TOKEN);
								var splitParentHierarchy=localParent.hierarchy.split(CS_TOKEN);
								//IF contains hirarchyParent(in the index 0) and have one more level is a child.

								if(splitlocalHierarchy.length-1==splitParentHierarchy.length && localHierarchy.indexOf(localParent.hierarchy)==0){
									//var compositeScorechildrens=getCompositeChildrens(compositeScore.hierarchy);
									if(programs[i].programStages[d].orderedCompositeScores.children[x].children==undefined){
										programs[i].programStages[d].orderedCompositeScores.children[x].children=[];
										programs[i].programStages[d].orderedCompositeScores.children[x].children.push(programs[i].programStages[d].compositeScores[y]);
										}
									else
										programs[i].programStages[d].orderedCompositeScores.children[x].children.push(programs[i].programStages[d].compositeScores[y]);
								}
							}
						}
						console.log(programs);
						//finish level:
						if(programs[i].programStages[d].orderedCompositeScores.children!=undefined){
							for(var x=0;x<programs[i].programStages[d].orderedCompositeScores.children.length;x++){
								if(programs[i].programStages[d].orderedCompositeScores.children[x].children!=undefined){
									for(var z=0;z<programs[i].programStages[d].orderedCompositeScores.children[x].children.length;z++){
										programs[i].programStages[d].orderedCompositeScores.children[x].children[z]=getCompositeScoreChildrens(programs[i].programStages[d].orderedCompositeScores.children[x].children[z],programs[i].programStages[d].compositeScores);
									}
								}
							}
						}
					}
				}
				
				console.log(programs);
			}

			//Order compositeScoreRoot and first children for each program.
			function orderAllCompositeScoresRoot(rootHierarchy){
				//Find and get the rootCS by program
				for(var i=0;i<programs.length;i++){
				var rootCS=undefined;
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
							if(rootHierarchy==programs[i].programStages[d].compositeScores[x].hierarchy){
								rootCS= programs[i].programStages[d].compositeScores[x];
							}
						}
						//Get the root first children.
						var localCompositeScoreChildren=[];
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									if(programs[i].programStages[d].compositeScores[x].hierarchy.indexOf(CS_TOKEN)==-1 && programs[i].programStages[d].compositeScores[x].hierarchy!=CS_ROOT){
										localCompositeScoreChildren.push(programs[i].programStages[d].compositeScores[x]);
									}
								}
						rootCS.children=localCompositeScoreChildren;
						programs[i].programStages[d].orderedCompositeScores=rootCS;
					}
				}
			}

			//Order compositeScoreRoot and first children for @compositeScores
			function orderCompositeScoreRoot(compositeScores,rootHierarchy){
				for(var x=0;x<compositeScores.length;x++){
					if(rootHierarchy==compositeScores[x].hierarchy){
						rootCS= compositeScores[x];
					}
				}
				//Get the root first children.
				var localCompositeScoreChildren=[];
				for(var x=0;x<compositeScores.length;x++){
					if(compositeScores[x].hierarchy.indexOf(CS_TOKEN)==-1 && compositeScores[x].hierarchy!=CS_ROOT){
						localCompositeScoreChildren.push(compositeScores[x]);
					}
				}
				rootCS.children=localCompositeScoreChildren;
				return rootCS;
			}

			function orderCompositeChildrens(compositeScores,compositeScoreRoot){
						//the element in orderedCompositeScores is the root and dont have new childrens
						for(var x=0;x<compositeScoreRoot.children.length;x++){
							for(var y=0;y<compositeScores.length;y++){
								var localParent=compositeScoreRoot.children[x]; 
								var localHierarchy=compositeScores[y].hierarchy; 

								var splitlocalHierarchy=localHierarchy.split(CS_TOKEN);
								var splitParentHierarchy=localParent.hierarchy.split(CS_TOKEN);
								//IF contains hirarchyParent(in the index 0) and have one more level is a child.

								if(splitlocalHierarchy.length-1==splitParentHierarchy.length && localHierarchy.indexOf(localParent.hierarchy)==0){
									//var compositeScorechildrens=getCompositeChildrens(compositeScore.hierarchy);
									if(compositeScoreRoot.children[x].children==undefined){
										compositeScoreRoot.children[x].children=[];
										compositeScoreRoot.children[x].children.push(compositeScores[y]);
										}
									else
										compositeScoreRoot.children[x].children.push(compositeScores[y]);
								}
							}
						}
						//add next levels:
						if(compositeScoreRoot.children!=undefined){
							for(var x=0;x<compositeScoreRoot.children.length;x++){
								if(compositeScoreRoot.children[x].children!=undefined){
									for(var z=0;z<compositeScoreRoot.children[x].children.length;z++){
										compositeScoreRoot.children[x].children[z]=getCompositeScoreChildrens(compositeScoreRoot.children[x].children[z],compositeScores);
									}
								}
							}
						}				
				return compositeScoreRoot;
			}

			function prepareEvents(){
				for(var i=0;i<events.length;i++){
					var compositeScores=undefined;
					for(var d=0;d<programs.length;d++){
						if(programs[d].id==events[i].program){
							//get a copy of the compositeScore including the denominator
							var compositeScores=programs[d].programStages[0].compositeScores;

							console.log("Working on event cs");
							compositeScores=addNumeratorInCS(compositeScores,events[i].dataValues);

							var compositeScoreRoot=orderCompositeScoreRoot(compositeScores,CS_ROOT);
							compositeScores=orderCompositeChildrens(compositeScores,compositeScoreRoot);	
							
							console.log("Finish event cs order");
							console.log(compositeScores);
							

						}
					}
				}

				
			}

			//Adds in compositeScores the final numerator from the datavalues.
			function addNumeratorInCS(compositeScores,dataValues){
				for(var i=0;i<dataValues.length;i++){
					for(var d=0;d<compositeScores.length;d++){
						if(dataValues[i].factor!=undefined){
							if(dataValues[i].compositeScore==compositeScores[d].hierarchy){
								if(compositeScores[d].numerator==undefined)
									compositeScores[d].numerator=dataValues[i].sumFactor;
								else
									compositeScores[d].numerator+=dataValues[i].sumFactor;
							}
						}
					}

				}
				return compositeScores;
			};
			function addDenominatorInCS(){
			console.log("AddingQuestionsDenominators");
			for(var i=0;i<programs.length;i++){
				var cuatrouno=0;
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var y=0;y<programs[i].programStages[d].questions.length;y++){
							var question=programs[i].programStages[d].questions[y]; 
							if(question.denominator!=undefined){
								//search the question compositeScore if is a computable question.
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									var localHierarchy=programs[i].programStages[d].questions[y].compositeScore.split(CS_TOKEN);
									if(programs[i].programStages[d].compositeScores[x]==undefined){
										console.log("cs undefined" + x);
										console.log(programs[i].programStages[d].questions[y]);
										continue;
									}
									var orderedcs=programs[i].programStages[d].compositeScores[x].hierarchy;
									if(orderedcs==question.compositeScore){
										if(programs[i].programStages[d].compositeScores[x].denominator==undefined){
											//To cast a string to number is necesary add +
											programs[i].programStages[d].compositeScores[x].denominator=(+question.denominator);
										}
										else{
												programs[i].programStages[d].compositeScores[x].denominator=(programs[i].programStages[d].compositeScores[x].denominator)+(+question.denominator);
										}
										continue;
									}
								}
							}
						}
					} 
				}
				console.log(programs);
			};
			function addDenominatorInCS2(){
			console.log("AddingQuestionsDenominators");
			for(var i=0;i<programs.length;i++){
				var cuatrouno=0;
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var y=0;y<programs[i].programStages[d].questions.length;y++){
							var question=programs[i].programStages[d].questions[y];
							if(question.compositeScore=="8.1.1"){
								cuatrouno=cuatrouno+(+question.denominator);
							}
							if(question.denominator!=undefined){
								//search the question compositeScore if is a computable question.
								for(var x=0;x<programs[i].programStages[d].orderedCompositeScores.children.length;x++){
									var localHierarchy=programs[i].programStages[d].questions[y].compositeScore.split(CS_TOKEN);
									if(programs[i].programStages[d].orderedCompositeScores.children[x]==undefined){
										console.log("cs undefined" + x);
										console.log(programs[i].programStages[d].questions[y]);
										continue;
									}
									var orderedcs=programs[i].programStages[d].orderedCompositeScores.children[x].hierarchy;
									if(orderedcs==question.compositeScore){
										if(programs[i].programStages[d].orderedCompositeScores.children[x].denominator==undefined){
											//To cast a string to number is necesary add +
											programs[i].programStages[d].orderedCompositeScores.children[x].denominator=(+question.denominator);
										}
										else{
												programs[i].programStages[d].orderedCompositeScores.children[x].denominator=(programs[i].programStages[d].orderedCompositeScores.children[x].denominator)+(+question.denominator);
										}
										continue;
									}
									else if(programs[i].programStages[d].orderedCompositeScores.children[x].hierarchy==localHierarchy[0]){
										var compositeScore=addDenominatorInChildren(programs[i].programStages[d].orderedCompositeScores.children[x],question);
										if(compositeScore!=undefined)
											programs[i].programStages[d].orderedCompositeScores.children[x]=compositeScore;
										continue;
									}
									else{
										//ont saved?
									}
								}
							}
						}
					}
					console.log("check 8.1.1"+cuatrouno);
				}
			};

			function addDenominatorInChildren(compositeScores,question){
				for(var i =0;i<compositeScores.children.length;i++){
					console.log("searching in child: " + compositeScores.children[i].hierarchy+ "to question "+ question.compositeScore);
					console.log("comparewith"+question.compositeScore.substring(0,question.compositeScore.lastIndexOf(CS_TOKEN)));
					if(compositeScores.children[i].hierarchy == question.compositeScore){
							if(compositeScores.children[i].denominator==undefined){
								//To cast a string to number is necesary add +
								compositeScores.children[i].denominator=(+question.denominator);
							}
							else{
								compositeScores.children[i].denominator=(+compositeScores.children[i].denominator)+(+question.denominator);
							}
							console.log("saved");
							console.log(compositeScores);
							return compositeScores;
						}
						else if(compositeScores.children[i].hierarchy==question.compositeScore.substring(0,question.compositeScore.lastIndexOf(CS_TOKEN))){
							console.log("new searching in childs");
							var compositeScore=addDenominatorInChildren(compositeScores.children[i],question);
							if(compositeScore!=undefined){
								compositeScores.children[i]=compositeScore;
							}
							else continue;
							return;
						}
					}

			}

			function buildFactors(){
				for(var i=0;i<events.length;i++){
					for(var d=0;d<events[i].dataValues.length;d++){
						var dataValue= events[i].dataValues[d];
						var indexOfFactor=dataValue.value.indexOf("[");
						var endOfFactor=dataValue.value.lastIndexOf("]");
						if(indexOfFactor!=-1 && endOfFactor!=-1){
							dataValue.factor=dataValue.value.substring(indexOfFactor+1,endOfFactor);
							var question=getQuestionByIdAndProgram(dataValue.dataElement,events[i].program);
							//Calculate the dataValue numerator
							dataValue.sumFactor=question.numerator*dataValue.factor;
							dataValue.compositeScore=question.compositeScore;
							events[i].dataValues[d]=dataValue;
							continue;
						}
						else{
							continue;
						}
					}
				}
			}

			var programDataelementsComplete=0;
			var programDataelementDownloaded=0;
						//Retrieve all events and upload it.
			function downloadEventsByProgram(program, startdate, endDate){
				allDownloaded++;
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
											allDownloaded--;
											if(allDownloaded==0){
												preparePrograms();
											}
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
								allDownloaded--;
								if(allDownloaded==0){
									preparePrograms();
								}
							}
						}
					},function(){$scope.invalidProgram=true;});

				console.log("events by program"+eventsByProgram);
			}
			function preparePrograms(){
				buildFactors();
				console.log("finish build factors");
				addDenominatorInCS();
				prepareEvents();
				console.log(programs);
				console.log(events);
			}
			}

	
}]);
