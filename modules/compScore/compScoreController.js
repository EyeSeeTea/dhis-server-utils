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


dhisServerUtilsConfig.controller('compScoreController', ["$scope",'$filter', "commonvariable", '$timeout', 'ProgramsList', 'CheckProgram', 'EventsByProgram', 'ProgramStageSectionsByProgramStage', 'ProgramStageDataElementsByProgramStageSection', 'DataElementsByProgramStageDataElements', 'OptionsSets', 'PatchEvent', function($scope, $filter, commonvariable, $timeout, ProgramsList, CheckProgram, EventsByProgram, ProgramStageSectionsByProgramStage, ProgramStageDataElementsByProgramStageSection, DataElementsByProgramStageDataElements, OptionsSets, PatchEvent) {

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

				//save the programStageDataElements in the ProgramStageSections
				function saveProgramStageSectionDataElements(data){
					//Save the programStageDataelements in the correct program->programStage
					var programStageDataElements=data.programStageDataElements;
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var y=0;y<programs[i].programStages[d].programStageSections.length;y++){
								if(programs[i].programStages[d].programStageSections[y].id==data.id){
									programs[i].programStages[d].programStageSections[y].programStageDataElements=(data.programStageDataElements);
								}
							}
						}
					}
				}

				//fixme not used
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
							for(var y = 0; y<programs[i].programStages[d].programStageSections.length;y++){
								for(var x = 0; x<programs[i].programStages[d].programStageSections[y].programStageDataElements.length;x++){
									if(programs[i].programStages[d].programStageSections[y].programStageDataElements[x].id==data.id){
										//Save the dataelement in the same level as programStageDataElements.
										if(programs[i].programStages[d].programStageSections[y].dataElements==undefined){
											programs[i].programStages[d].programStageSections[y].dataElements=[];
										}
										programs[i].programStages[d].programStageSections[y].dataElements.push(data.dataElement);
									}
								}
							}
						}
					}
				}
				function saveProgramStageSections(data){
					for(var i = 0; i<programs.length;i++){
						for(var d = 0; d<programs[i].programStages.length;d++){
							if(programs[i].programStages[d].id==data.id){
								//Save the dataelement in the same level as programStageDataElements.
								if(programs[i].programStages[d].programStageSections==undefined){
									programs[i].programStages[d].programStageSections=[];
								}
								programs[i].programStages[d].programStageSections=(data.programStageSections);
							}
						}
					}
				}


				//handler
				var resultProgramStage;
				//async number of calls.
				var totalProgramStages=0;

				//Retrireve all programsStage metadata
				function downloadMetadataByProgramStage(){
					//download each programStage 
					for(var d=0;d<programs.length;d++){
						//programStages
						for(var i=0;i<programs[d].programStages.length;i++){
							totalProgramStages++;
							//Returns the programStageDataElements from the ProgramStages
							resultProgramStage=ProgramStageSectionsByProgramStage.get({programStage:programs[d].programStages[i].id});	
							resultProgramStage.$promise.then(function(data) {
								//save the dataelements in the program/programstages/questions /program/programstages/compositeScores
								saveProgramStageSections(data);
								totalProgramStages--;
								if(totalProgramStages==0){
									console.log(programs);
									downloadMetadataByProgramStageSection();
			 					}
							},function(){$scope.unexpectedError=true;});
						}					
					}

				}
				//handler
				//the program stage section represents the tabgroup
				var resultProgramStageSection;
				//async number of calls.
				var totalProgramStagesSections=0;
				//Retrireve all programsStage metadata
				function downloadMetadataByProgramStageSection(){
					//download each programStage 
					for(var d=0;d<programs.length;d++){
						//programStages
						for(var i=0;i<programs[d].programStages.length;i++){
							//Returns the programStageDataElements from the ProgramStagesSection
							for(var y=0;y<programs[d].programStages[d].programStageSections.length;y++){
								totalProgramStagesSections++;
								resultProgramStageSection=ProgramStageDataElementsByProgramStageSection.get({programStageSection:programs[d].programStages[i].programStageSections[y].id});	
								resultProgramStageSection.$promise.then(function(data) {
									//save the dataelements in the program/programstages/questions /program/programstages/compositeScores
									saveProgramStageSectionDataElements(data);
									totalProgramStagesSections--;
									if(totalProgramStagesSections==0){
										console.log("program stages sections donwloaded");
										console.log(programs);
										downloadMetadataByProgramStageDataElement();
				 					}
								},function(){$scope.unexpectedError=true;});
							}
						}					
					}

				}

				var controlProgramStageDataelementsDownloaded=0;
				//Retrieve all programStageDataElements metadata
				function downloadMetadataByProgramStageDataElement(){
					for(var i=0;i<programs.length;i++){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var x=0;x<programs[i].programStages[d].programStageSections.length;x++){
								for(var y=0;y<programs[i].programStages[d].programStageSections[x].programStageDataElements.length;y++){
								//Count to control the async download
								//the programs is async object... maybe it could be wrong.
								controlProgramStageDataelementsDownloaded++;


								//Returns the DataElements from the ProgramStageDataElements
								//Fixme: we need add delay here or something;
								console.log("Downloading programStagesDataElements");
								resultProgramStageDataElement=DataElementsByProgramStageDataElements.get({programStageDataElement:programs[i].programStages[d].programStageSections[x].programStageDataElements[y].id});	
								resultProgramStageDataElement.$promise.then(function(data) {
									saveDataElementsFromProgramStageDataElements(data);
									controlProgramStageDataelementsDownloaded--;
									if(controlProgramStageDataelementsDownloaded==0){
										console.log("Finish DataElements from programStageDataElement");
										buildAllDataElements();
										controlProgramStageDataelementsDownloaded;
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
				}
				
			//Save the dataelement as question or composite score for each program/programstage.
			function buildAllDataElements(){
				for(var i = 0; i<programs.length;i++){
					for(var d = 0; d<programs[i].programStages.length;d++){
						for(var y = 0; y<programs[i].programStages[d].programStageSections.length;y++){
							for(var x = 0; x<programs[i].programStages[d].programStageSections[y].dataElements.length;x++){
								var dataElement=buildDataElement(programs[i].programStages[d].programStageSections[y].dataElements[x]);
								if(dataElement!=undefined){
									if(dataElement.type==QUESTION){
										if(programs[i].programStages[d].programStageSections[y].questions==undefined){
											programs[i].programStages[d].programStageSections[y].questions=[];
										}
										programs[i].programStages[d].programStageSections[y].questions.push(dataElement);
									}
									else if(dataElement.type==COMPOSITE_SCORE){
										if(programs[i].programStages[d].programStageSections[y].compositeScores==undefined){
											programs[i].programStages[d].programStageSections[y].compositeScores=[];
										}
										programs[i].programStages[d].programStageSections[y].compositeScores.push(dataElement);
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
			function getQuestionByIdAndProgram(dataElementUid,programUid){
				var question=undefined;
				for(var i=0;i<programs.length;i++){
					if(programs[i].id==programUid){
						for(var d=0;d<programs[i].programStages.length;d++){
							for(var y=0;y<programs[i].programStages[d].programStageSections.length;y++){
								if(programs[i].programStages[d].programStageSections[y].questions!=undefined){
									for(var x=0;x<programs[i].programStages[d].programStageSections[y].questions.length;x++){
										if(programs[i].programStages[d].programStageSections[y].questions[x].uid==dataElementUid){
											return programs[i].programStages[d].programStageSections[y].questions[x];
										}
									}		
								}
							}
						}			
					}
				}
				return question;
			}

			//fixme not used
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


			//build the compositeScore tree
			function getCompositeScoreChildrens(compositeScoreParent,compositeScores){
				var compositeScoreslength=getLengthObject(compositeScores);
				for(var x=0;x<compositeScoreslength;x++){
					var localParent=compositeScoreParent; 
					var localHierarchy=compositeScores[x].hierarchy;
					var splitlocalHierarchy=localHierarchy.split(CS_TOKEN);
					var splitParentHierarchy=localParent.hierarchy.split(CS_TOKEN);
					//IF contains hirarchyParent(in the index 0) and have one more level is a child.
					if(splitlocalHierarchy.length-1==splitParentHierarchy.length && localHierarchy.indexOf(localParent.hierarchy)==0){
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

			//when an object lost her reference, lost her propieties like length
			function getLengthObject(data){
				var count=0;
				for (var value in data){
					count++;
				}
				return count;
			}

			//Order compositeScoreRoot and first children for @compositeScores
			function orderCompositeScoreRoot(compositeScores,rootHierarchy){
				var rootCS=undefined;
				var compositeScoreslength=getLengthObject(compositeScores);
				for(var x=0;x<compositeScoreslength;x++){
					if(rootHierarchy==compositeScores[x].hierarchy){
						rootCS= $.extend(true,{},compositeScores[x]);
					}
				}
				//Get the root first children.
				var localCompositeScoreChildren=[];
				for(var x=0;x<compositeScoreslength;x++){
					if(compositeScores[x].hierarchy.indexOf(CS_TOKEN)==-1 && compositeScores[x].hierarchy!=CS_ROOT){
						localCompositeScoreChildren.push(compositeScores[x]);
					}
				}
				rootCS.children=localCompositeScoreChildren;
				return rootCS;
			}

			function orderCompositeChildrens(compositeScores,compositeScoreRoot){
				var compositeScoreRoot=jQuery.extend({},compositeScoreRoot);
						for(var x=0;x<compositeScoreRoot.children.length;x++){
							var compositeScoreslength=getLengthObject(compositeScores);
							for(var y=0;y<compositeScoreslength;y++){
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

			//Prepare all the event scores from the datavalues and the event program compositescores
			function prepareEvents(){
				for(var i=0;i<events.length;i++){
					var compositeScores=undefined;
					for(var d=0;d<programs.length;d++){
						if(programs[d].id==events[i].program){

							var compositeScoresEvent=undefined;
							var compositeScoresScored=undefined;
							var compositeScoreRoot=undefined;
							var compositeScoresOrdered=undefined;
							//get a copy of the compositeScore including the denominator
							compositeScoresEvent=$.extend(true,{},programs[d].programStages[0].compositeScores);
							console.log(compositeScoresEvent);
							compositeScoresScored=addNumeratorInCS(compositeScoresEvent,events[i].dataValues);
							//compositeScoreRoot=orderCompositeScoreRoot(compositeScoresScored,CS_ROOT);
							//compositeScoresOrdered=orderCompositeChildrens(compositeScoresScored,compositeScoreRoot);	
							//events[i].compositeScoresOrdered=compositeScoresOrdered;
							console.log("Finish event cs order");
							
							//console.log(compositeScoresScored);
							//console.log(compositeScoresOrdered);
							continue;
						}
					}console.log(programs);
				}
			}

			//Adds in compositeScores the final numerator from the datavalues.
			function addNumeratorInCS(compositeScores,dataValues){
				for(var i=0;i<dataValues.length;i++){

					if(dataValues[i].factor!=undefined){
						var compositeScoreslength=getLengthObject(compositeScores);
						for(var d=0;d<compositeScoreslength;d++){
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
				var cuatrouno=0;
					for(var d=0;d<programs[i].programStages.length;d++){
						for(var v=0;v<programs[i].programStages[d].programStageSections.length;v++){
							if(programs[i].programStages[d].programStageSections[v].questions!=undefined){
								for(var y=0;y<programs[i].programStages[d].programStageSections[v].questions.length;y++){
									var question=programs[i].programStages[d].programStageSections[v].questions[y]; 
									if(question.denominator!=undefined){
										//search the question compositeScore if is a computable question.
										if(programs[i].programStages[d].programStageSections[v].compositeScores!=undefined){
											for(var x=0;x<programs[i].programStages[d].programStageSections[v].compositeScores.length;x++){
												if(programs[i].programStages[d].programStageSections[v].questions[y].compositeScore==undefined){
													console.log("question without compositescore");
													console.log(programs[i].programStages[d].programStageSections[v].questions[y])
													continue;
												}
												var localHierarchy=programs[i].programStages[d].programStageSections[v].questions[y].compositeScore.split(CS_TOKEN);
												if(programs[i].programStages[d].programStageSections[v].compositeScores[x]==undefined){
													console.log("cs undefined" + x);
													console.log(programs[i].programStages[d].programStageSections[v].questions[y]);
													continue;
												}
												var localCompositeScore=programs[i].programStages[d].programStageSections[v].compositeScores[x].hierarchy;
												if(localCompositeScore==question.compositeScore){
													if(programs[i].programStages[d].programStageSections[v].compositeScores[x].denominator==undefined){
														//To cast a string to number is necesary add +
														programs[i].programStages[d].programStageSections[v].compositeScores[x].denominator=(+question.denominator);
													}
													else{
														programs[i].programStages[d].programStageSections[v].compositeScores[x].denominator=(programs[i].programStages[d].compositeScores[x].denominator)+(+question.denominator);
													}
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
			};


			//Save the factor, the compositeScore and the sumFactor in each dataValue
			function prepareDataValues(){
				for(var i=0;i<events.length;i++){
					for(var d=0;d<events[i].dataValues.length;d++){
						//if the factor is in the value:
						var dataValue= events[i].dataValues[d];
						var indexOfFactor=dataValue.value.indexOf("[");
						var endOfFactor=dataValue.value.lastIndexOf("]");
						var question=getQuestionByIdAndProgram(dataValue.dataElement,events[i].program);
						if(indexOfFactor!=-1 && endOfFactor!=-1){
							dataValue.factor=dataValue.value.substring(indexOfFactor+1,endOfFactor);
							//Calculate the dataValue numerator
							dataValue.sumFactor=question.numerator*dataValue.factor;
							dataValue.compositeScore=question.compositeScore;
							events[i].dataValues[d]=dataValue;
							continue;
						}
						else{
							//if the value not had the factor:
							if(question==undefined){
								console.log("question undefined");
								//console.log(dataValue);
								continue;
							}
							if(question.optionSet==undefined){
								console.log("question without");
								//console.log(dataValue);
								continue;
							}
							var optionSet=getOptionSetById(question.optionSet.id);
							if(optionSet==undefined){
								console.log("ooptionset undefined");
								console.log(question);
								continue;
							}
							for(var x=0;x<optionSet.options.length;x++){
								//if the value is a option name(normal)
								if(optionSet.options[x].name==dataValue.value){
								var indexOfFactor=optionSet.options[x].code.indexOf("[");
								var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

								if(indexOfFactor!=-1 && endOfFactor!=-1){
									dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
									//Calculate the dataValue numerator
									dataValue.sumFactor=question.numerator*dataValue.factor;
									dataValue.compositeScore=question.compositeScore;
									console.log(dataValue.value+dataValue.factor);
									events[i].dataValues[d]=dataValue;
									continue;
									}
								}
							}
								
							for(var x=0;x<optionSet.options.length;x++){
									//If the server save the value as YES [1] and the datavalue as YES
									if(optionSet.options[x].code.indexOf(dataValue.value)!=-1){
										var indexOfFactor=optionSet.options[x].code.indexOf("[");
										var endOfFactor=optionSet.options[x].code.lastIndexOf("]")

										if(indexOfFactor!=-1 && endOfFactor!=-1){

											dataValue.factor=optionSet.options[x].code.substring(indexOfFactor+1,endOfFactor);
											//Calculate the dataValue numerator
											dataValue.sumFactor=question.numerator*dataValue.factor;
											dataValue.compositeScore=question.compositeScore;
											events[i].dataValues[d]=dataValue;
											console.log("fixed"+dataValue.value+dataValue.factor);
											continue;
										}
								}
							}
							continue;
							}
					}
				}
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
										eventsByprogramsDownloaded--;
										if(eventsByprogramsDownloaded==0){
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

			function getChildrenScores(){
				
			}

			function calculateCStree(compositeScoresTree){
				for(var i=0;i<compositeScoresTree.length;i++){
					var scores=compositeScoresTree[i].getChildrenScores();
					if(compositeScoresTree[i].numerator==undefined){
						if(scores.numerator!=undefined)
							compositeScoresTree[i].numerator=scores.numerator;
						else
							compositeScoresTree[i].numerator=0;
					}
					if(compositeScoresTree[i].denominator==undefined || compositeScoresTree[i].denominator==0){
						console.log("the composite score not have denominator"+compositeScoresTree[i]);
						continue;
					}
					compositeScoresTree[i].finalScore=(compositeScoresTree[i].numerator/compositeScoresTree[i].denominator)*100;
					console.log("final main score:"+compositeScoresTree[i].finalScore);
				}
			}

			function calculateCSEvents(){
				for(var i=0;i<events.length;i++){
					events[i].compositeScoresOrdered=calculateCStree(events[i].compositeScoresOrdered);
				}
			}

			function preparePrograms(){
				console.log(programs);
				console.log(events);
				console.log("Prepare dataValues for each event");
				prepareDataValues();
				addDenominatorInCS();
				console.log("Prepare the compositeScore events");
				prepareEvents();
				console.log("Update the compositeScore by Event");
				//calculateCSEvents();
				console.log(programs);
				console.log(events);
				//sendEvents();
			}
		}


	
}]);
