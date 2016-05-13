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


dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'ProgramStageDataElementsByProgramStage', 'DataElementsByProgramStageDataElements', 'OptionsSets', 'UpdateEvent', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, ProgramStageDataElementsByProgramStage, DataElementsByProgramStageDataElements, OptionsSets, UpdateEvent) {

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
				
				var debug=false;
				var debugEventFilter="";
				//postEventsRequestLimit is the maximum number of simultaneous POST requests queue

				var postEventsRequestLimit=4;

				//SERVER VALUES
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

				//Some error messages:
				$scope.loginError=false;
				$scope.invalidProgram=false;
				$scope.unexpectedError=false;
				$scope.finish=false;
				$scope.errorUploading=false;
				$scope.noevents=false;
				angular.element(document.querySelector('#progressbar>div>span')).text($translate('IN_PROGRESS'));
				//Parse date
				var start_date=$filter('date')($scope.start_date,'yyyy-MM-dd');
				var end_date=$filter('date')($scope.end_date,'yyyy-MM-dd');


				//handlers for async calls.
				var resultOptionSet;
				var resultEvent;
				var newResultEvent;
				var resultProgramStageDataElement;
				var resultProgramStage;
				var resultUploadedEvent;

				//List of events
				var events;

				//list of programs
				var programs=[];

				//List of optionsets
				var optionSets;
								
				//This variables are used to control the number of active asyn calls.
				//When the value is 0 no calls are active.
				//Adds one for each call.
				var totalEvents=0;
				var totalPrograms=0;
				var totalProgramStages=0;
				var programsDownloaded=0;
				var controlProgramStageDataelementsDownloaded=0;
				var eventsByprogramsDownloaded=0;

				//allDownloaded controls the async calls for the events and programs.
				var allDownloaded=0;

				//On sumbit, the program starts here:
				if(($scope.program_uid)==undefined || ($scope.program_uid)==""){
					//Requests all the programs or checks
					var resultPrograms=ProgramsList.get();
				}
				else{
					//Request the introduced program (to check if exists)
					var resultPrograms=CheckProgram.get({uid:$scope.program_uid});
				}
				
				//Retrieve all data from the programs and events and will send it at the end.
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

				//Retrieve the optionsSets and after retrieve the selected program and the events program in the provided date. And Continue.
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
					//Save program in global variable
					programs.push(program);
					//continue downloading All the metadata
					downloadMetadataByProgramStage();					
				}

				//Retrieve the programStageDataelements for each ProgramStage
				function saveProgramStageDataElements(data){
					var programStageDataElements=data.programStageDataElements;
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].id==data.id){
								programs[i].programStages[d].programStageDataElements=(data.programStageDataElements);
							}
						}
					}
				}


				//Retrive the dataelements from the programStageDataElements for each ProgramStage.
				function saveDataElementsFromProgramStageDataElementsByProgramStage(data){
					for(var i = 0; i<programs.length;i++){
						for(var d = 0; d<programs[i].programStages.length;d++){
							for(var y = 0; y<programs[i].programStages[d].programStageDataElements.length;y++){
									if(programs[i].programStages[d].programStageDataElements[y].id==data.id){
										if(programs[i].programStages[d].dataElements==undefined){
											programs[i].programStages[d].dataElements=[];
										}
										programs[i].programStages[d].dataElements.push(data.dataElement);
								}
							}
						}
					}
				}

				//Retrireve all the programStageDataElements from each ProgramStage
				function downloadMetadataByProgramStage(){
					//download each programStage 
					for(var d=0;d<programs.length;d++){
						//programStages
						for(var i=0;i<programs[d].programStages.length;i++){
								totalProgramStages++;
								resultProgramStage=ProgramStageDataElementsByProgramStage.get({programStage:programs[d].programStages[i].id});	
								resultProgramStage.$promise.then(function(data) {
									saveProgramStageDataElements(data);
									totalProgramStages--;
									if(totalProgramStages==0){
										console.log("program stages donwloaded");
										console.log(programs);
										downloadMetadataByProgramStageDataElement();
				 					}
								},function(){$scope.unexpectedError=true;});
						}					
					}
				}

				//Retrieve all programStageDataElements metadata
				function downloadMetadataByProgramStageDataElement(){
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var y=0;y<programs[i].programStages[d].programStageDataElements.length;y++){
								controlProgramStageDataelementsDownloaded++;
								resultProgramStageDataElement=DataElementsByProgramStageDataElements.get({programStageDataElement:programs[i].programStages[d].programStageDataElements[y].id});	
								resultProgramStageDataElement.$promise.then(function(data) {
									saveDataElementsFromProgramStageDataElementsByProgramStage(data);
									controlProgramStageDataelementsDownloaded--;
									if(controlProgramStageDataelementsDownloaded==0){
										console.log("Finish DataElements from programStageDataElement");
										console.log(programs);
										buildAllDataElements();
										allDownloaded--;
										if(allDownloaded==0){
											uploadPrograms();
									}
			 					}
							},function(){$scope.unexpectedError=true;});
						}
					}
				}
			}
				
			//Store the dataElements in the questions or compositeScore list.
			function buildAllDataElements(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
							for(var x = 0; x<programs[i].programStages[d].dataElements.length;x++){
								//build question/compoisteScore
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
				//Build the question child/parent relations
				buildParentChildRelations();
				if(!debug){
					//Remove the dataelements and prograStageDataelements
					for(var i = 0; i<programs.length;i++){
						for(var d=0; d<programs[i].programStages.length;d++){
							delete programs[i].programStages[d].dataElements;
							delete programs[i].programStages[d].programStageDataElements;
						}
					}
				}
			}

			//Build the parent/child question relations
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
										if(debug){
											if(questions[y].debugChildren==undefined){
												questions[y].debugChildren=[];
											}
											questions[y].debugChildren.push(question);
											if(programs[i].parentQuestions==undefined){
												programs[i].parentQuestions=[];
											}
											programs[i].parentQuestions.push(questions[y]);
										}
									}
								}
							}
						}
					}
				}
			}


			//create a question or composite score from the dataelement.
			function buildDataElement(data){
				var newElement = new Object();
				newElement.uid=data.id;
				//First loop to know if is a Composite score or a Question.
				for(var i=0;i<data.attributeValues.length;i++){
					if(data.attributeValues[i].attribute.id==SERVER_ATTRIBUTE_UID){
						if(data.attributeValues[i].value==QUESTION){
							if(data.optionSet==undefined){
								var isCalculable=false;
								//fixme: it is ignoring the questions without numerator.
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
							if(debug==true){
								console.log("Error? no question and not composite score");
								console.log(data);
							}
						}
					}
				}
				newElement.name=data.name;
				//Second loop adds the correct propierties.
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

			//save all the events in events global list.
			function saveEvents(data){
				if(data.events!=undefined){
					if(events==undefined){
						events=[];
					}
					for(var i=0;i<data.events.length;i++){
						if(debug)
							if(debugEventFilter!=""){
								if(data.events[i].event==debugEventFilter){
									events.push(data.events[i]);
								}
							}
							else{
								events.push(data.events[i]);
							}
						else{
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


			//Prepare all the composite scores with the particular numerator/denominator for each event
			function prepareEvents(){

				for(var i=0;i<events.length;i++){
					if(events[i].dataValues==undefined){
						console.log("event without dataValues");
						console.log(events[i]);
						continue;
					}

					//checks each question(not scoreded too) for hide childrens.
					showOrHideChildrens(events[i]);

					//Prepare dataValues(find the factor) and store (num*factor) in the event(and show/hide the questions with relations parent/child).
					prepareDataValuesByEvent(events[i]);
				
					var compositeScores=undefined;
					for(var d=0;d<programs.length;d++){
						if(programs[d].id==events[i].program){

							var compositeScoresEvent=undefined;
							//Add the compositeScores in each event.
							compositeScoresEvent=programs[d].programStages[0].compositeScores;
							if(programs[d].programStages.length>1){
								for(var x=1;x<programs[d].programStages.length;x++){
									compositeScoresEvent=compositeScoresEvent.concat(programs[d].programStages[x].compositeScores);
								}
							}
							buildCompositeScoresByEvent(compositeScoresEvent,events[i]);
						}
					}
				}
			}
			
			//Add denominators, numerators, and calcule CS Scores.
			function buildCompositeScoresByEvent(compositeScoresEvent,event){
				if(debug)
					console.log("adding denominators");
				//Store the denominators from the questions in the global CS
				addDenominatorInCS(event);
				//Store the numerators(caculated * factor) from the event data values in the event CS
				if(debug)
					console.log("adding event numerators");
				addNumeratorInCS(compositeScoresEvent,event);
				//propage the child CS numerator/denominator to the parent CS denominator
				if(debug)
					console.log("propage num/denum");
				propageCSChildrenNumeratosAndDenominators();
				//calculate the compositeScores
				if(debug)
					console.log("calculate");
				calculateCSScores(event);
							
				//Calculate the event CS, store it in the event and clear the CS
				if(debug)
					console.log("update scores");
				updateScores(event);
				clearAllCS();
				clearParentQuestions();
			}


			//Adds all the question denominators to the question composite score.
			function addDenominatorInCS(event){
			for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						if(programs[i].programStages[d].questions!=undefined){
							for(var y=0;y<programs[i].programStages[d].questions.length;y++){
								var question=programs[i].programStages[d].questions[y]; 
								if(question.denominator!=undefined){
									//Discard not scored questions
									if(!isScored(question.option)){
										if(debug){
											if(event.discartedQuestions==undefined){
												event.discartedQuestions=[];
											}
												event.discartedQuestions.push(jQuery.extend({},question));
										}
										continue;
									}
									//discard question without Compositescore
									if(question.compositeScore==undefined){
										if(debug){
											if(event.discartedQuestions==undefined){
												event.discartedQuestions=[];
											}
											event.discartedQuestions.push(jQuery.extend({},question));
										}
										if(debug)
											saveErrorQuestionWithoutCS(question);
										continue;
									}
									//Discard children not visible questions:
									if(question.isChild!=undefined){
										if(question.isChild==true && question.parent.isShowed==false){
											if(debug){
												if(localCompositeScore.discartedQuestions==undefined){
													localCompositeScore.discartedQuestions=[];
												}
												localCompositeScore.discartedQuestions.push(jQuery.extend({},question));
											}
											continue;
										}
									}

									//Find the question CompositeScore and add the denominator.
									for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
										var localCompositeScore=programs[i].programStages[d].compositeScores[x];
										if(localCompositeScore.hierarchy==question.compositeScore){

											if(question.isChild==undefined || question.isChild==true && question.parent.isShowed==true){
											if(localCompositeScore.denominator==undefined){
												//To cast a string to number is necesary: (+value)
												localCompositeScore.denominator=(+question.denominator);
											}
											else{
												//To cast a string to number is necesary: (+value)
												programs[i].programStages[d].compositeScores[x].denominator=(localCompositeScore.denominator)+(+question.denominator);
											}
											if(debug){
												if(programs[i].programStages[d].compositeScores[x].addedQuestions==undefined){
													programs[i].programStages[d].compositeScores[x].addedQuestions=[];
												}
												programs[i].programStages[d].compositeScores[x].addedQuestions.push(question);
											}
											}
										}								
									}
								}
							}
						}
					} 
				}
				if(debug){
					if(errorQuestionsWithoutCS.length!=undefined && errorQuestionsWithoutCS.length>0){
						console.log("question without compositescore");
						console.log(errorQuestionsWithoutCS);
					}
				}
			};

			//Propage the CompositeScores from the lower compositeScorehirearchy, level by level.
			//Example: Calculate all the 1.1.1 1.1.2 1.1.3 and propage the num/denum to 1.1 for each one.
			//Propage the stored CompositeScore denominator to the parent denominator/numerator, from lower level to upper level.
			function propageCSChildrenNumeratosAndDenominators(){
				for(var i=0;i<programs.length;i++){
					depth=getLowestDepth(programs[i]);
					for(var actualDepth=depth;actualDepth>0;actualDepth--){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									var compositeScore=programs[i].programStages[d].compositeScores[x];
									//Add the depth childrens denominator into the parent
									if(compositeScore.depth==actualDepth){
										if(compositeScore.parent!=undefined){
											//Propage denominators
											if(compositeScore.denominator!=undefined){
												if(compositeScore.parent.denominator==undefined){
													compositeScore.parent.denominator=compositeScore.denominator;
												}
												else{
													compositeScore.parent.denominator+=compositeScore.denominator;
												}
											}
											//propage numerators
											if(compositeScore.numerator!=undefined){
												//save the numerator in the parent
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
				}
			}



			//Adds the compositeScore numerator number reading the saved (numerator*factor) datavalue.
			function addNumeratorInCS(compositeScores,event){
				for(var i=0;i<event.dataValues.length;i++){
					if(event.dataValues[i].factor!=undefined){
						if(debug)
							var isSaved=false;
						for(var d=0;d<compositeScores.length;d++){
							if(event.dataValues[i].compositeScore!=undefined){
								if(event.dataValues[i].compositeScore==compositeScores[d].hierarchy){
										if(compositeScores[d].numerator==undefined)
											compositeScores[d].numerator=(+event.dataValues[i].sumFactor);
										else
											compositeScores[d].numerator+=(+event.dataValues[i].sumFactor);
										if(debug){
											if(compositeScores[d].debugDataValues==undefined){
												compositeScores[d].debugDataValues=[];
											}
											compositeScores[d].debugDataValues.push(jQuery.extend(true,{},event.dataValues[i]));
											if(compositeScores[d].debugnumerator==undefined)
												compositeScores[d].debugnumerator=(+event.dataValues[i].sumFactor);
											else
												compositeScores[d].debugnumerator+=(+event.dataValues[i].sumFactor);
											isSaved=true;
										}
									}
							}
						}
						if(debug && !isSaved){
							if(event.debugNotAddedInCS==undefined)
								event.debugNotAddedInCS=[]; 
							event.debugNotAddedInCS.push(jQuery.extend(true,{},event.dataValues[i]));
						}
					}

				}
			};

			//return the lowest depth value in compositeScore hierarchy.
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


			//Calculate all the CompositeScore in a program with the stored (numerator*factor/denumerator) and calc the score.
			function calculateCSScores(event){
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==event.program){
						//calculateCSByDepth(programUid);
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){
								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
									var compositeScore=programs[i].programStages[d].compositeScores[x];
									var numerator=0;
									if(compositeScore.numerator!=undefined){
										numerator=compositeScore.numerator;
									}
									if(compositeScore.denominator!=undefined)
										compositeScore.score=Math.round((numerator/compositeScore.denominator)*100);
									if(debug){
										if(event.debugCompositeScores==undefined){
											event.debugCompositeScores=[];
										}
										var debugCompositeScore=jQuery.extend({},compositeScore);
										event.debugCompositeScores.push(jQuery.extend({},debugCompositeScore));
										delete compositeScore.addedQuestions;
										delete compositeScore.debugDataValues;
										delete compositeScore.debugnumerator;
									}
								}		
							}
						}			
					}
				}
			}

			//Save the actual CS score in the event.
			function updateScores(event){
				//Clear dataValues
				event.oldDataValues=event.dataValues;
				delete event.dataValues;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==event.program){
						for(var d=0;d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].compositeScores!=undefined){

								for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){

									if(programs[i].programStages[d].compositeScores[x].score!=undefined){
										if(event.dataValues==undefined){
											event.dataValues=[];
											if(debug)
												event.debugDataValues=[];
										}
										var dataValue= new Object;
										dataValue.dataElement=jQuery.extend({},programs[i].programStages[d].compositeScores[x]).uid;
										dataValue.value=jQuery.extend({},programs[i].programStages[d].compositeScores[x]).score;
										event.dataValues.push(dataValue);
									}
								}
							}
						}			
					}
				}
			}

			function clearAllCS(){
				//Clear CS
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var x=0;x<programs[i].programStages[d].compositeScores.length;x++){
							delete programs[i].programStages[d].compositeScores[x].score;
							delete programs[i].programStages[d].compositeScores[x].numerator;
							delete programs[i].programStages[d].compositeScores[x].denominator;
						}
					}
				}
			}


			function clearParentQuestions(){
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var x=0;x<programs[i].programStages[d].questions.length;x++){
							if(programs[i].programStages[d].questions[x].isParent!=undefined){
								programs[i].programStages[d].questions[x].isShowed=false;
							}
						}
					}
				}
			};


			//Discard the questions without this options.
			function isScored(value){
				return (value!=undefined && (value==DROPDOWN_LIST || value==DROPDOWN_LIST_DISABLED || value==RADIO_GROUP_VERTICAL || value==RADIO_GROUP_HORIZONTAL))
			}

			//show and hide the parents in all the questions(not scored.. not CS.. etc)


			//sets the parent as show
			function showOrHideChildrens(event){

					if(event.dataValues==undefined)
						return;
					for(var d=0;d<event.dataValues.length;d++){
						var dataValue= event.dataValues[d];

					var question=getQuestionByIdAndProgram(dataValue.dataElement,event.program);
						if(question==undefined){
							continue;
						}
					if(question.isParent!=undefined){
						console.log(question);
						//Try to extract the factor from the DataValue value.
						var indexOfFactor=dataValue.value.indexOf("[");
						var endOfFactor=dataValue.value.lastIndexOf("]");
						if(indexOfFactor!=-1 && endOfFactor!=-1){
							dataValue.factor=dataValue.value.substring(indexOfFactor+1,endOfFactor);
							if(dataValue.factor>0){
								question.isShowed=true;
							}
							else{
								question.isShowed=false;
							}
						}
						else{
							//If the factor isn't in the DataValue value extracts it from the question optionSet.

							if(question.optionSet==undefined){
								//if the question don't have optionset discard it.
								continue;
							}

							var optionSet=getOptionSetById(question.optionSet.id);
							if(optionSet==undefined){
								//if the question optionset is not downloaded discard it.
								continue;
							}
							//try to estract the factor from the option code.
							for(var x=0;x<optionSet.options.length;x++){
								//if the value is a option name
								if(optionSet.options[x].name==dataValue.value){
								var indexOfFactor=optionSet.options[x].code.indexOf("[");
								var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

								if(indexOfFactor!=-1 && endOfFactor!=-1){
									dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
									//Calculate the dataValue numerator
									if(dataValue.factor>0){
										question.isShowed=true;
									}
									else{
										question.isShowed=false;
									}
									continue;
									}
								}
							}
							//try to extract the factor from the option code
							for(var x=0;x<optionSet.options.length;x++){
									//If the server save the value as YES [1] and the datavalue as YES
									if(optionSet.options[x].code.indexOf(dataValue.value)!=-1){
										var indexOfFactor=optionSet.options[x].code.indexOf("[");
										var endOfFactor=optionSet.options[x].code.lastIndexOf("]")
										if(indexOfFactor!=-1 && endOfFactor!=-1){

											dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
											if(dataValue.factor>0){
												question.isShowed=true;
											}
											else{
												question.isShowed=false;
											}
										continue;
									}
								}
							}
						}

					}
				}

			}
			//Add the numerator*factor value in the dataValue.
			function prepareDataValuesByEvent(event){
					if(event.dataValues==undefined)
						return;
					for(var d=0;d<event.dataValues.length;d++){
						var dataValue= event.dataValues[d];
						//Discard the CompositeScores values, and add in the event compositeScore list to be updated at the end.
						var compositeScore=getCSByIdAndProgram(dataValue.dataElement,event.program);
						if(compositeScore!=undefined){ 
							if(event.compositeScores==undefined){
								event.compositeScores=[];
								event.compositeScores.push(compositeScore);
								continue;
							}
							var isSaved=false;
							for(var x=0;x<event.compositeScores.length;x++)
								if(event.compositeScores[x].uid==compositeScore.uid)
									isSaved=true;
								if(!isSaved)
									event.compositeScores.push(compositeScore);
							continue;
						}
						var question=getQuestionByIdAndProgram(dataValue.dataElement,event.program);
						if(question==undefined || question.option==undefined){
							saveErrorValueWithoutQuestion(dataValue);
							continue;
						}
						//discard the question if isn't scored question.
						if(!isScored(question.option))
							continue;

						//Try to extract the factor from the DataValue value.
						var indexOfFactor=dataValue.value.indexOf("[");
						var endOfFactor=dataValue.value.lastIndexOf("]");
						if(indexOfFactor!=-1 && endOfFactor!=-1){
							dataValue.factor=dataValue.value.substring(indexOfFactor+1,endOfFactor);
							event.dataValues[d]=saveDataValueFactor(dataValue,question);
							continue;
						}
						else{
							//If the factor isn't in the DataValue value extracts it from the question optionSet.
							if(question.optionSet==undefined){
								//if the question don't have optionset discard it.
								if(debug){
									question.dataValue=dataValue.value;
									dataValue.question=question.uid;
									saveErrorValue(dataValue);
									question.problem="the question don't have optionset";
									saveErrorQuestion(question);
								}
								continue;
							}

							var optionSet=getOptionSetById(question.optionSet.id);
							if(optionSet==undefined){
								//if the question optionset is not downloaded discard it.
								if(debug){
									question.dataValue=dataValue.value;
									dataValue.question=question.uid;
									saveErrorValue(dataValue);
									question.problem="the donwloaded optionset not found";
									saveErrorQuestion(question);
								}
								continue;
							}
							//try to estract the factor from the option code.
							for(var x=0;x<optionSet.options.length;x++){
								//if the value is a option name
								if(optionSet.options[x].code!=undefined && optionSet.options[x].name==dataValue.value){
								var indexOfFactor=optionSet.options[x].code.indexOf("[");
								var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

								if(indexOfFactor!=-1 && endOfFactor!=-1){
									dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
									//Calculate the dataValue numerator
									event.dataValues[d]=saveDataValueFactor(dataValue,question);
									continue;
									}
								}
							}
							//try to extract the factor from the option code
							for(var x=0;x<optionSet.options.length;x++){
									//If the server save the value as YES [1] and the datavalue as YES
									if(optionSet.options[x].code!=undefined && optionSet.options[x].code.indexOf(dataValue.value)!=-1){
										var indexOfFactor=optionSet.options[x].code.indexOf("[");
										var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

										if(indexOfFactor!=-1 && endOfFactor!=-1){

											dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
											//Calculate the dataValue numerator
											event.dataValues[d]=saveDataValueFactor(dataValue,question);
										continue;
									}
								}
							}
						}
					}
				if(debug){
					console.log(events);
					console.log("Questions with problems")
					console.log(errorQuestions);
					console.log("Datavalues unsent")
					console.log(errorDataValues);
					console.log("DataValues without questions")
					console.log(errorDataValuesWithoutQuestion);
					
				}
			}

			function saveDataValueFactor(dataValue,question){
				//The children questions will seek the parent variable "isShowed" from their parents to find out if they are computable.
				if(dataValue.factor>0){
					if(question.isParent!=undefined && question.isParent==true){
						//If the factor is 1 the parent is selected.
						question.isShowed=true;
					}
				}
				else{
					if(question.isParent!=undefined && question.isParent==true){
						//If the factor isn't 1, the parent isn't selected.
						question.isShowed=false;
					}	
				}
				//the dataValue sum factor is used to add the event numerators in the compositeScores.
				dataValue.sumFactor=question.numerator*dataValue.factor;
				dataValue.compositeScore=question.compositeScore;
				//If the question don't have numerator this calc is NaN and it should be 0.
				if(isNaN(dataValue.sumFactor)){
					dataValue.sumFactor=0;
					if(debug){
						question.dataValue=dataValue.value;
						dataValue.question=question.uid;
						question.problem="not numerator";
						saveErrorValue(dataValue);
						saveErrorQuestion(question);
					}
				}
				return dataValue;
			}


			//Some debug variables and method to read the dataValues discarted of the calc.
			var errorDataValues=[];

			var errorDataValuesWithoutQuestion=[];

			var errorQuestions=[];

			var errorQuestionsWithoutCS=[];

			function saveErrorValue(data){
				if(!debug)
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
				if(!debug)
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
				if(!debug)
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
				if(!debug)
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

			//Retrieve all events and upload it.
			function downloadEventsByProgram(program, startdate, endDate){
				allDownloaded++;
				var page=1;
				var totalEvents=0;
				var totalPage=0;
				eventsByprogramsDownloaded++;
				console.log("Upload Events by program");
				angular.element(document.querySelector('#progressbar>div>span')).text($translate('DOWNLOADING_EVENTS'));
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
											console.log("All the events was downloaded");
											console.log(events.length);
											console.log(events);
											//checks if the metadta and the events was downloaded;
											allDownloaded--;
											if(allDownloaded==0){
												uploadPrograms();
											}
										}
									}
								},function(){$scope.invalidProgram=true;});
							}
						}
						else{	
							//Only one page:
							saveEvents(data);
							eventsByprogramsDownloaded--;
							if(eventsByprogramsDownloaded==0 || (debug==true && debugEventFilter!="")){
								if(events==undefined){
									$scope.noevents=true;
									return;			
								}
								if(events.length>=totalEvents  || (debug==true && debugEventFilter!="")){
									allDownloaded--;
									if(allDownloaded==0){
										uploadPrograms();
									}
								}
							}
						}
					},function(){$scope.invalidProgram=true;});
			}

			//Add the compositeScore parents @parentCompositeScore in a child in @compositeScores
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
			var uploadedEvents=0;
			//Prepare the event to sent new compositeScores for each event.
			function sendEvents(){
				for(var i=0;i<events.length;i++){
					if(events[i].dataValues==undefined){
						uploadedEvents++;
						continue;
					}

					var dataValues=[];
					dataValues.dataValues=events[i].dataValues;
					var Event= new Object;

					Event.event=events[i].event;

					Event.lastUpdated=events[i].lastUpdated;

					Event.notes=events[i].notes;

					Event.dueDate=events[i].dueDate;

					Event.program=events[i].program;

					Event.enrollment=events[i].enrollment;

					Event.lastUpdated=events[i].lastUpdated;

					Event.orgUnit=events[i].orgUnit;

					Event.followup=events[i].followup;

					Event.enrollmentStatus=events[i].enrollmentStatus;

					Event.storedBy=events[i].storedBy;

					Event.programStage=events[i].programStage;

					Event.tackedEntityInstance=events[i].tackedEntityInstance;

					Event.eventDate=events[i].eventDate;

					Event.created=events[i].created;

					Event.href=events[i].href;

					Event.status=events[i].status;

					Event.orgUnitName=events[i].orgUnitName;

					Event.coordinate=events[i].coordinate;
					for(var x=0;x<events[i].dataValues.length;x++){
						var isActive=false;
						if(events[i].compositeScores==undefined){
							continue;
						}
						for(var d=0;d<events[i].compositeScores.length;d++){
							if(events[i].dataValues[x].dataElement==events[i].compositeScores[d].uid){
								dataValues.push(events[i].dataValues[x]);
							}
						}
					}
					Event.dataValues=dataValues;
					if(debug){
						console.log("send event:");
						console.log(Event);
					}
					eventsReady.push(Event);
				}
				for(var i=0;i<postEventsRequestLimit;i++){
						if(eventsReady[i]!=undefined){
							Event=eventsReady.pop();
							pendingEvents.push(Event);
							pushEvent(Event);
						}
				}
			}

			//The sent events are controlled with the next lists:
			//"eventsReady" that contains all the event to be send.
			//"pendingEvents" is the list with all the sent events, they are waiting the server response by each event.
			//If the event was saved in the server is removed from this list, and one event from "eventsReady" is sent and move to "pendingEvents"
			//At the end: if pendingEvents have events, they are sent but not confirmed.
			//At the end: if eventsReady have events, they was prepared to be sent but never sent.
			var eventsReady=[];
			var pendingEvents=[];
			function pushEvent(Event){
				resultUploadedEvent=UpdateEvent.post(Event);

				resultUploadedEvent.$promise.then(function(data) {
					if(data.httpStatusCode==200){
						if(data.response.importSummaries!=undefined)
							if(data.response.importSummaries[0].reference!=undefined)
								var sentEvent=data.response.importSummaries[0].reference;
						//Try to remove the event uid from pending
						if(removeEventFromQueue(sentEvent))
						{
							uploadedEvents++;
							var value=$translate('SENDING')+uploadedEvents+$translate('OF')+events.length;
							angular.element(document.querySelector('#progressbar>div>span')).text(value);
							$scope.progressbarDisplayed
							console.log("sent:"+uploadedEvents+ " from "+events.length);
							if(events.length==uploadedEvents){
								//All the event was send
								showLog();
								if(pendingEvents.length>0){
									//All the events in the pending event list was send.
									$scope.errorUploading=true;	
								}
								else
									$scope.finish=true;
								$scope.progressbarDisplayed = false;
							}
							else{
								//move next event from eventsReady to pendingevents and push it.
								if(eventsReady.length>0){
									Event=eventsReady.pop();
									console.log(Event);
									pendingEvents.push(Event);
									pushEvent(Event);
								}
							}
						}
						else{
							//If the eventuid in the importsummaries is not in the pendingevent list:
							showLog();
							$scope.errorUploading=true;	
							console.log("failed sending event:");
							console.log(Event);
						}
					}
					else{
						//If the post event fail
						showLog();
						$scope.errorUploading=true;	
						console.log("failed sending event:");
						console.log(Event);
					}
				},function(){$scope.errorUploading=true;});
			}

			//Remove the eventuid from the pendingevents list
			function removeEventFromQueue(eventuid){
				for(var i=0;i<pendingEvents.length;i++){
					if(pendingEvents[i].event==eventuid){
						pendingEvents.splice(i,1);
						pendingEvents=removeUndefinedFromArray(pendingEvents);
						console.log(pendingEvents);
						return true;
					}
				}
				return false;
			}

			//removes all the undefined values from array
			function removeUndefinedFromArray(array){
				var newArray=[];
				var element;
				for(element in array){
					if(array[element]!=undefined){
						newArray.push(array[element]);
					}	
				}
				return newArray;
			}

			//Add compositeScore parent relation.
			function addParentsInAllCompositeScores(){
				for(var i=0;i<programs.length;i++){
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var y=0;y<programs[i].programStages[d].compositeScores.length;y++){
							var compositeScore=programs[i].programStages[d].compositeScores[y];
							addParentInCompositeScore(programs[i].programStages[d].compositeScores,compositeScore);
						}
					} 
				}
			}

			//uploadPrograms prepare the dataValues, compositeScores, events, and send all the events.
			function uploadPrograms(){
				angular.element(document.querySelector('#progressbar>div>span')).text($translate('CALCULATING_SCORES'));
				addParentsInAllCompositeScores();
				console.log("prepare all events");
				prepareEvents();

				if(debug){
					console.log("Show errors in questions")
					console.log(errorQuestions);
					console.log("Show errors in dataValues")
					console.log(errorDataValues);
					console.log("Show errors in dataValues without questions")
					console.log(errorDataValuesWithoutQuestion);
					console.log("Show all programs");
					console.log(programs);
					console.log("Show all events");
					console.log(events);
				}
				sendEvents();
			}
			function showLog(){
				console.log("Show all programs");
				console.log(programs);
				console.log("Show all events");
				console.log(events);
				console.log("Pending events in queue");
				console.log(pendingEvents);
				console.log("Ready but not sent");
				console.log(eventsReady);
			}

		}
}]);
