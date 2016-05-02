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


dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'ProgramStageDataElementsByProgramStage', 'DataElementsByProgramStageDataElements', 'OptionsSets', 'PatchEvent', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, ProgramStageDataElementsByProgramStage, DataElementsByProgramStageDataElements, OptionsSets, PatchEvent) {

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
				
				//show all the CS datavalues with numerator/denominator/score/uid/hirarchycal code.
				var debugDatavalues=true;
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
				var SERVER_QUESTION_CHILD="CHILD";
				var SERVER_QUESTION_PARENT="PARENT";
				var SERVER_QUESTION_RELATION_UID="mvGz6QTxEQq";
				var SERVER_QUESTION_GROUP_UID="LsjVjwl69sP";
				var CS_TOKEN=".";
				var CS_ROOT="1";

				//Question option types
				var DROPDOWN_LIST=1;
				var DROPDOWN_LIST_DISABLED=10;
				var RADIO_GROUP_HORIZONTAL=8;
				var RADIO_GROUP_VERTICAL=9;


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

				//List of optionsets
				var optionSets;
				
				
				//Count variables to control when finish the async calls. 
				var totalEvents=0;
				var totalPrograms=0;
				var programsDownloaded=0;

				//all downloaded control all the asyncalls to continue after pull events and programs.
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

				//download the programs and the events and at the end of the async calls prepare and send the events with the new composite scores
				function downloadProgram(program){
					resultOptionSet=OptionsSets.get();	
					resultOptionSet.$promise.then(function(data) {
						optionSets=data;
						console.log(optionSets);
						downloadMetadataByProgram(program);
						downloadEventsByProgram(program.id,start_date,end_date);
					},function(){$scope.unexpectedError=true;});
				}

				//Retrireve all the metadata by program. The @data contains the program and the programStagesid
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
					//continue downloading All the metadata
					downloadMetadataByProgramStage();					
				}

				//Save the programStageDataelements in the correct program->programStage
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


				function saveDataElementsFromProgramStageDataElementsByProgramStage(data){
					for(var i = 0; i<programs.length;i++){
						for(var d = 0; d<programs[i].programStages.length;d++){
							for(var y = 0; y<programs[i].programStages[d].programStageDataElements.length;y++){
									if(programs[i].programStages[d].programStageDataElements[y].id==data.id){
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

				var resultProgramStage;
				//async number of calls.
				var totalProgramStages=0;
				//Retrireve all programsStage metadata
				function downloadMetadataByProgramStage(){
					//download each programStage 
					for(var d=0;d<programs.length;d++){
						//programStages
						for(var i=0;i<programs[d].programStages.length;i++){
							//Returns the programStageDataElements from the ProgramStages
								totalProgramStages++;
								resultProgramStage=ProgramStageDataElementsByProgramStage.get({programStage:programs[d].programStages[i].id});	
								resultProgramStage.$promise.then(function(data) {
									//save the dataelements in the program/programstages/questions /program/programstages/compositeScores
									saveProgramStageDataElements(data);
									totalProgramStages--;
									if(totalProgramStages==0){
										console.log("program stages sections donwloaded");
										console.log(programs);
										downloadMetadataByProgramStageDataElement();
				 					}
								},function(){$scope.unexpectedError=true;});
						}					
					}
				}

				var controlProgramStageDataelementsDownloaded=0;
				//Retrieve all programStageDataElements metadata
				function downloadMetadataByProgramStageDataElement(){
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var y=0;y<programs[i].programStages[d].programStageDataElements.length;y++){
								//Count to control the async download
								//the programs is async object... maybe it could be wrong.
								controlProgramStageDataelementsDownloaded++;


								//Returns the DataElements from the ProgramStageDataElements
								//Fixme: we need add delay here or something;
								console.log("Downloading programStagesDataElements");
								resultProgramStageDataElement=DataElementsByProgramStageDataElements.get({programStageDataElement:programs[i].programStages[d].programStageDataElements[y].id});	
								resultProgramStageDataElement.$promise.then(function(data) {
									saveDataElementsFromProgramStageDataElementsByProgramStage(data);
									controlProgramStageDataelementsDownloaded--;
									if(controlProgramStageDataelementsDownloaded==0){
										console.log("Finish DataElements from programStageDataElement");
										buildAllDataElements();
										console.log(programs);
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
				
			//Save the dataelement as question or composite score for each program/programstage.
			function buildAllDataElements(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
							for(var x = 0; x<programs[i].programStages[d].dataElements.length;x++){
								var dataElement=buildDataElement(programs[i].programStages[d].dataElements[x]);
								if(dataElement!=undefined){
									if(dataElement.type==QUESTION){
										if(programs[i].programStages[d].questions==undefined){
											programs[i].programStages[d].questions=[];
											if(programs[i].programStages[d].questions==undefined){
												programs[i].programStages[d].questions=[];
											}
										}
										programs[i].programStages[d].questions.push(dataElement);
									}
									else if(dataElement.type==COMPOSITE_SCORE){
										if(programs[i].programStages[d].compositeScores==undefined){
											programs[i].programStages[d].compositeScores=[];
											if(programs[i].programStages[d].compositeScores==undefined){
												programs[i].programStages[d].compositeScores=[];
											}
										}
										programs[i].programStages[d].compositeScores.push(dataElement);
									}
								}
						}
					}
				}
				buildParentChildRelations();
			}

			//Build the parent-child question relations
			function buildParentChildRelations(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
						for(var x = 0; x<programs[i].programStages[d].questions.length;x++){
							var questions= programs[i].programStages[d].questions;
							var question=programs[i].programStages[d].questions[x];
							if(question.isChild!=undefined && question.isChild==true){
								for(var y =0;y<questions.length;y++){
									if(questions[y].isParent!=undefined && questions[y].isParent && questions[y].group==question.group){
										question.parent=questions[y];
									}
								}
							}
						}
					}
				}
			}


			//create a question or composite score from the dataelement.
			function buildDataElement(data){
				var isScored=false;
				var newElement = new Object();
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
						if(data.attributeValues[i].attribute.id==SERVER_QUESTION_RELATION_UID){
							if(data.attributeValues[i].value==SERVER_QUESTION_PARENT){
								newElement.isParent=true;
							}
							else if(data.attributeValues[i].value==SERVER_QUESTION_CHILD){
								newElement.isChild=true;
							}
						}
						if(data.attributeValues[i].attribute.id==SERVER_QUESTION_GROUP_UID){
							newElement.group=data.attributeValues[i].value;
						}
						if(data.attributeValues[i].attribute.id==SERVER_QUESTIONTYPE_UID){
							newElement.option=data.attributeValues[i].value;
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


			//returns the optionset with the @optionsetuid
			function getOptionSetById(optionSetUid){
				var optionSet=undefined;
				for(var i=0;i<optionSets.optionSets.length;i++){
					if(optionSets.optionSets[i].id==optionSetUid)
						return optionSets.optionSets[i];
				}
				return optionSet;
			}


			//returns the question with uid dataelement for a program.
			function getCSByIdAndProgram(dataElementUid,programUid){
				var compositeScores=undefined;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						for(var d=0;d<programs[i].programStages.length;d++){
								if(programs[i].programStages[d].compositeScores!=undefined){
									for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
										if(programs[i].programStages[d].compositeScores[x].uid==dataElementUid){
											return programs[i].programStages[d].compositeScores[x];
										}
									}		
								}
						}			
					}
				}
				return compositeScores;
			}

			//returns the question with uid dataelement for a program.
			function getQuestionByIdAndProgram(dataElementUid,programUid){
				var question=undefined;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						for(var d=0;d<programs[i].programStages.length;d++){
								if(programs[i].programStages[d].questions!=undefined){
									for(var x=0;x<programs[i].programStages[d].questions.length;x++){
										if(programs[i].programStages[d].questions[x].uid==dataElementUid){
											return programs[i].programStages[d].questions[x];
										}
									}		
								}
						}			
					}
				}
				return question;
			}

			function calculateCSScores(programUid){
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						calculateCSByDepth(programUid);
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									var compositeScore=programs[i].programStages[d].compositeScores[x];
									var numerator=0;
									if(compositeScore.numerator!=undefined){
										numerator=compositeScore.numerator;
									}
									if(compositeScore.denominator!=undefined)
										compositeScore.score=(numerator/compositeScore.denominator)*100;
								}		
							}
						}			
					}
				}
			}

			function getLowestDepth(program){
				var depth=0;

				for(var d=0;d<program.programStages.length;d++){
					if(program.programStages[d].compositeScores!=undefined){
						for(var x=0;x<program.programStages[d].compositeScores.length;x++){
							if(program.programStages[d].compositeScores[x].hasChildren==undefined){
								if(program.programStages[d].compositeScores[x].depth>depth){
									depth=program.programStages[d].compositeScores[x].depth;
								}
							}
						}		
					}
				}	
				return depth;	
			}

			function propageChildrenDenominators(){
				for(var i=0;i<programs.length;i++){
					depth=getLowestDepth(programs[i]);
					//Add numerator/denominator from children to parents by depth
					for(var actualDepth=depth;actualDepth>0;actualDepth--){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									var compositeScore=programs[i].programStages[d].compositeScores[x];
									//Add the depth childrens denominator into the parent
									if(compositeScore.depth==actualDepth){
										if(compositeScore.denominator!=undefined){
											if(compositeScore.parent!=undefined){
												if(compositeScore.parent.denominator==undefined){
													compositeScore.parent.denominator=compositeScore.denominator;
												}
												else{
													compositeScore.parent.denominator+=compositeScore.denominator;
												}
											}
										}
									}
								}		
							}
						}			
					}
				}
				console.log("Added all denominators");
			}

			function calculateCSByDepth(programUid){
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						//get the 
						depth=getLowestDepth(programs[i]);

						//Add numerator/denominator from children to parents by depth
						for(var actualDepth=depth;actualDepth>0;actualDepth--){
								for(var d=0;d<programs[i].programStages.length;d++){
									if(programs[i].programStages[d].compositeScores!=undefined){
										for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){

											var compositeScore=programs[i].programStages[d].compositeScores[x];
											//Add the depth childrens numerator/denominator into the parent
											if(compositeScore.depth==actualDepth){
												if(compositeScore.parent!=undefined){
													if(compositeScore.numerator!=undefined){
														if(compositeScore.parent.numerator==undefined){
															compositeScore.parent.numerator=compositeScore.numerator;
														}
														else{
															compositeScore.parent.numerator+=compositeScore.numerator;
														}
													}
												}
											}
										}		
									}
								}			
							}
						console.log("Calculated Composite Scores");
						console.log(programs[i].programStages);
					}
				}
			}

			function updateScores(event){
				//Clear dataValues
				delete event.dataValues;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==event.program){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									if(programs[i].programStages[d].compositeScores[x].score!=undefined){
										if(event.dataValues==undefined){
											event.dataValues=[];
											if(debugDatavalues==true)
												event.debugDataValues=[];
										}
										var dataValue= new Object;
										var localCompositeScoreCopy=jQuery.extend(true,{},programs[i].programStages[d].compositeScores[x]);
										dataValue.dataElement=jQuery.extend(true,{},programs[i].programStages[d].compositeScores[x]).uid;
										dataValue.value=jQuery.extend(true,{},programs[i].programStages[d].compositeScores[x]).score;
										event.dataValues.push(dataValue);
									}
									if(programs[i].programStages[d].compositeScores[x].hierarchy==6){
										console.log(programs[i].programStages[d].compositeScores[x].score);
										console.log(event.event);
									}
									//Clear CS
									delete programs[i].programStages[d].compositeScores[x].score;
									delete programs[i].programStages[d].compositeScores[x].numerator;
									delete programs[i].programStages[d].compositeScores[x].denominator;
										if(debugDatavalues==true){
											var debugDataValue= new Object();
											debugDataValue.dataElement=localCompositeScoreCopy;
											debugDataValue.value=localCompositeScoreCopy.score;
											debugDataValue.denominator=localCompositeScoreCopy.denominator;
											debugDataValue.numerator=localCompositeScoreCopy.numerator;
											debugDataValue.hierarchy=localCompositeScoreCopy.hierarchy;
											event.debugDataValues.push(debugDataValue);
										}
								}
							}
						}			
					}
				}
			}

			function prepareCompositeScores(compositeScoresEvent,event){
				//Store the question denominators in CS
				addDenominatorInCS();
				//propage the child CS to the parent CS denominator
				propageChildrenDenominators();
				//add the numerators from the event data values
				addNumeratorInCS(compositeScoresEvent,event.dataValues);
				//calculate the compositeScores
				calculateCSScores(event.program);
			}

			//Prepare all the event scores from the datavalues and the event program compositescores
			function prepareEvents(){
				console.log(events[i]);
				for(var i=0;i<events.length;i++){
					var compositeScores=undefined;
					for(var d=0;d<programs.length;d++){
						if(programs[d].id==events[i].program){

							var compositeScoresEvent=undefined;
							var compositeScoresScored=undefined;
							var compositeScoreRoot=undefined;
							var compositeScoresOrdered=undefined;
							//Fixme programStage[0]
							compositeScoresEvent=programs[d].programStages[0].compositeScores;
							prepareCompositeScores(compositeScoresEvent,events[i]);
							//add the cs score in the event and clear the score
							updateScores(events[i]);
							continue;
						}
					}
				}
				console.log("CS saved in event");
				console.log(events[i]);
			}

			//Adds in compositeScores the final numerator from the datavalues.
			function addNumeratorInCS(compositeScores,dataValues){
				for(var i=0;i<dataValues.length;i++){

					if(dataValues[i].factor!=undefined){
						for(var d=0;d<compositeScores.length;d++){
							if(dataValues[i].compositeScore!=undefined){
								if(dataValues[i].compositeScore==compositeScores[d].hierarchy){
										if(compositeScores[d].numerator==undefined)
											compositeScores[d].numerator=dataValues[i].sumFactor;
										else
											compositeScores[d].numerator+=dataValues[i].sumFactor;
									}
							}
						}
					}

				}
				return compositeScores;
			};

			//Adds all the question denominators for one composite score in that compositescore for each program.
			function addDenominatorInCS(){
			console.log("AddingQuestionsDenominators");
			for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						if(programs[i].programStages[d].questions!=undefined){
							for(var y=0;y<programs[i].programStages[d].questions.length;y++){
								var question=programs[i].programStages[d].questions[y]; 
								if(question.denominator!=undefined){
									//search the question compositeScore if is a computable question.
									if(programs[i].programStages[d].compositeScores!=undefined){
										for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
											if(programs[i].programStages[d].questions[y].compositeScore==undefined){
												if(debugDataValues)
													saveErrorQuestionWithoutCS(programs[i].programStages[d].questions[y]);
												continue;
											}
											var localHierarchy=programs[i].programStages[d].questions[y].compositeScore.split(CS_TOKEN);
											var localCompositeScore=programs[i].programStages[d].compositeScores[x].hierarchy;
											if(localCompositeScore==question.compositeScore){
												//if a question is child and the question parent is not showed that question is ignored.
												if(question.isChild==undefined || question.parent.isShowed==true){
													if(programs[i].programStages[d].compositeScores[x].denominator==undefined){
														//To cast a string to number is necesary add +
														programs[i].programStages[d].compositeScores[x].denominator=(+question.denominator);
														continue;
													}
													else{
														programs[i].programStages[d].compositeScores[x].denominator=(programs[i].programStages[d].compositeScores[x].denominator)+(+question.denominator);
														continue;
													}
												}
											}
										}
									}
								}
							}
						}
					} 
				}
				console.log("question without compositescore");
				console.log(errorQuestionsWithoutCS);
			};


			//Save the factor, the compositeScore and the sumFactor in each dataValue
			var errorDataValues=[];

			var errorDataValuesWithoutQuestion=[];

			var errorQuestions=[];

			var errorQuestionsWithoutCS=[];

			function saveErrorValue(data){
				if(!debugDatavalues)
					return;
				if(data!=undefined){
				var isSaved=false;
					for(var x=0;x<errorDataValues.length;x++)
						if(errorDataValues[x].dataElement==data.dataElement)
							isSaved=true;
						if(!isSaved)
							errorDataValues.push(data);
				
				}
			}

			function saveErrorValueWithoutQuestion(data){
				if(!debugDatavalues)
					return;
				if(data!=undefined){
				var isSaved=false;
					for(var x=0;x<errorDataValuesWithoutQuestion.length;x++)
						if(errorDataValuesWithoutQuestion[x].dataElement==data.dataElement)
							isSaved=true;
						if(!isSaved)
							errorDataValuesWithoutQuestion.push(data);
				
				}
			}

			function saveErrorQuestion(data){
				if(!debugDatavalues)
					return;
				if(data!=undefined){
				var isSaved=false;
					for(var x=0;x<errorQuestions.length;x++)
						if(errorQuestions[x].uid==data.uid)
							isSaved=true;
						if(!isSaved)
							errorQuestions.push(data);
				}
			}

			function saveErrorQuestionWithoutCS(data){
				if(!debugDatavalues)
					return;
				if(data!=undefined){
				var isSaved=false;
					for(var x=0;x<errorQuestionsWithoutCS.length;x++)
						if(errorQuestionsWithoutCS[x].uid==data.uid)
							isSaved=true;
						if(!isSaved)
							errorQuestionsWithoutCS.push(data);
				}
			}

			function isScored(value){
				if(value==DROPDOWN_LIST || value==DROPDOWN_LIST_DISABLED || value==RADIO_GROUP_VERTICAL || value==RADIO_GROUP_HORIZONTAL)
					return true;
				return false;
			}

			function prepareDataValues(){
				for(var i=0;i<events.length;i++){
					for(var d=0;d<events[i].dataValues.length;d++){
						var dataValue= events[i].dataValues[d];
						var compositeScore=getCSByIdAndProgram(dataValue.dataElement,events[i].program);
						if(compositeScore!=undefined){
						if(debugDatavalues)
							console.log(compositeScore);
							if(events[i].compositeScores==undefined){
								events[i].compositeScores=[];
								events[i].compositeScores.push(compositeScore);
								continue;
							}
							var isSaved=false;
							for(var x=0;x<events[i].compositeScores.length;x++)
								if(events[i].compositeScores[x].uid==compositeScore.uid)
									isSaved=true;
								if(!isSaved)
									events[i].compositeScores.push(compositeScore);
							continue;
						}
						//if the factor is in the value:
						var indexOfFactor=dataValue.value.indexOf("[");
						var endOfFactor=dataValue.value.lastIndexOf("]");
						var question=getQuestionByIdAndProgram(dataValue.dataElement,events[i].program);
						if(question==undefined || question.option==undefined){
							saveErrorValueWithoutQuestion(dataValue);
							continue;
						}
						if(!isScored(question.option))
							continue;
						if(indexOfFactor!=-1 && endOfFactor!=-1){
							dataValue.factor=dataValue.value.substring(indexOfFactor+1,endOfFactor);
							//Calculate the dataValue numerator

							events[i].dataValues[d]=saveDataValueFactor(dataValue,question);
							continue;
						}
						else{
							//if the value not had the factor:
							if(question.optionSet==undefined){
								question.dataValue=dataValue.value;
								dataValue.question=question.uid;
								saveErrorValue(dataValue);
								question.problem="not optionset";
								saveErrorQuestion(question);
								continue;
							}
							var optionSet=getOptionSetById(question.optionSet.id);
							if(optionSet==undefined){
								question.dataValue=dataValue.value;
								dataValue.question=question.uid;
								saveErrorValue(dataValue);
								question.problem="not optionset downloaded";
								saveErrorQuestion(question);
								continue;
							}
							//get factor by code
							for(var x=0;x<optionSet.options.length;x++){
								//if the value is a option name(normal)
								if(optionSet.options[x].name==dataValue.value){
								var indexOfFactor=optionSet.options[x].code.indexOf("[");
								var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

								if(indexOfFactor!=-1 && endOfFactor!=-1){
									dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
									//Calculate the dataValue numerator
									events[i].dataValues[d]=saveDataValueFactor(dataValue,question);
									continue;
									}
								}
							}
							//get factor by name
							for(var x=0;x<optionSet.options.length;x++){
									//If the server save the value as YES [1] and the datavalue as YES
									if(optionSet.options[x].code.indexOf(dataValue.value)!=-1){
										var indexOfFactor=optionSet.options[x].code.indexOf("[");
										var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

										if(indexOfFactor!=-1 && endOfFactor!=-1){

											dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
											//Calculate the dataValue numerator
											events[i].dataValues[d]=saveDataValueFactor(dataValue,question);
											continue;
										}
								}
							}
							continue;
							}
					}
				}
				if(debugDatavalues){
					console.log(events);
					console.log("error in questions")
					console.log(errorQuestions);
					console.log("error in dataValues")
					console.log(errorDataValues);
					console.log("error in dataValues without questions")
					console.log(errorDataValuesWithoutQuestion);
					
				}
			}

			function saveDataValueFactor(dataValue,question){

				if(dataValue.factor==1){
					if(question.isParent!=undefined && question.isParent==true){
						question.isShowed=true;
					}
				}
				else{
					if(question.isParent!=undefined && question.isParent==true){
						question.isShowed=false;
					}	
				}
				dataValue.sumFactor=question.numerator*dataValue.factor;
				dataValue.compositeScore=question.compositeScore;
				if(isNaN(dataValue.sumFactor)){
					dataValue.sumFactor=0;
					question.dataValue=dataValue.value;
					dataValue.question=question.uid;
					question.problem="not numerator";
					saveErrorValue(dataValue);
					saveErrorQuestion(question);
				}
				return dataValue;
			}

			//control the asyn calls
			var eventsByprogramsDownloaded=0;
			//Retrieve all events and upload it.
			function downloadEventsByProgram(program, startdate, endDate){
				allDownloaded++;
				var page=1;
				var totalEvents=0;
				var totalPage=0;
				eventsByprogramsDownloaded++;
				console.log("Upload Events by program");
				resultEvent = EventsByProgram.get({program:program,startDate:startdate,endDate:endDate,page:page});
				resultEvent.$promise.then(function(data) {
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
									saveEvents(nextPageData);
									if(events.length>=totalEvents){
										eventsByprogramsDownloaded--;
										if(eventsByprogramsDownloaded==0){
											console.log("All the events was downloaded")
											console.log(events);
											//checks if the metadta and the events was downloaded;
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
							//if(events!=undefined)
							eventsByprogramsDownloaded--;
							if(eventsByprogramsDownloaded==0){
								if(events.length>=totalEvents){
									//checks if the metadta and the events was downloaded;
									allDownloaded--;
									if(allDownloaded==0){
										preparePrograms();
									}
								}
							}
						}
					},function(){$scope.invalidProgram=true;});
			}

			//Add parent @parentCompositeScore in a child in the @compositeScores list
			function addParentInCompositeScore(compositeScores,parentCompositeScore){
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						if(programs[i].programStages[d].compositeScores!=undefined){
							for(var y=0;y<programs[i].programStages[d].compositeScores.length;y++){
								var childCompositeScore=programs[i].programStages[d].compositeScores[y];
								var parentHierarchy=parentCompositeScore.hierarchy;
								var childHierarchy=childCompositeScore.hierarchy;
								parentCompositeScore.depth=parentHierarchy.split(CS_TOKEN).length;
								childCompositeScore.depth=childHierarchy.split(CS_TOKEN).length;
								if(childHierarchy.split(CS_TOKEN).length-1==parentHierarchy.split(CS_TOKEN).length && childHierarchy.indexOf(parentHierarchy)==0){
									parentCompositeScore.hasChildren=true;
									childCompositeScore.parent=parentCompositeScore;
								}

							}
						}
					} 
				}
			}

			function sendEvents(){
				for(var i=0;i<events.length;i++){
					//the patch needs some event dataValue.dataElement included in the dataValues array to work in the server side.
					var dataElement=events[i].dataValues[0].dataelement;
					console.log(events[i]);
					PatchEvent.patch({eventuid:events[id].event,dataValueUid:events[i].dataValues[0]});
					break;
				}
			}

			//add parent for each compositeScore
			function addParentsInAllCompositeScores(){
				console.log("Adding CS parent relations");
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						if(programs[i].programStages[d].questions!=undefined){
							for(var y=0;y<programs[i].programStages[d].compositeScores.length;y++){
								var compositeScore=programs[i].programStages[d].compositeScores[y];
								addParentInCompositeScore(programs[i].programStages[d].compositeScores,compositeScore);
							}
						}
					} 
				}
			}

			function preparePrograms(){
				console.log(programs);
				console.log(events);
				console.log("Prepare dataValues for each event");
				prepareDataValues();
				addParentsInAllCompositeScores();
				console.log("Prepare the compositeScore events");
				prepareEvents();

				if(debugDatavalues){
					console.log(events);
					console.log("error in questions")
					console.log(errorQuestions);
					console.log("error in dataValues")
					console.log(errorDataValues);
					console.log("error in dataValues without questions")
					console.log(errorDataValuesWithoutQuestion);
					
				}
				console.log("Update the compositeScore by Event");
				console.log(programs);
				console.log(events);
				sendEvents();
			}

		}


	
}]);
