import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { Router, ActivatedRoute } from '@angular/router';
import {Params} from '@angular/router';

import { User, Claim, Patient, Address } from '../_models';
import { EOB, Coverage, CoverageGroup } from '../_models';
import { OAuthAttributes } from '../_models';

import { UserService } from '../_services';
import { AuthenticationService } from '../_services';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { of, throwError, BehaviorSubject } from 'rxjs';

@Component({templateUrl: 'home.component.html'})
export class HomeComponent implements OnInit {
    users: User[] = [];
    eobsArray =  [];
    eobClaims = [];
    code: string;
    selectedClaim : Claim;
    patient : Patient;
    coverage : Coverage[];
    coverageSubject = new BehaviorSubject<Coverage[]>([]);
    totalCountSubject = new BehaviorSubject<any>({});

    token : any;
    authorizeUrl : string = (new OAuthAttributes()).authorizeUrl;

    claimIndex : number;
    showingIndex : number;
    showAuthLink : boolean = false;

    claimListLoading : boolean = false;
    pageLoading : boolean = false;
    patientLoading : boolean = false;
    coverageLoading : boolean = false;

    logoImg = "assets/images/My_Elth_PLUS_Logo_Transparent.png";
    nameImg = "assets/images/My_Elth_NAME_LOGO.png";

    constructor(private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private userService: UserService) {}

    ngOnInit() {
        
        var currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if(currentUser == null || currentUser === undefined){
            this.code = this.route.snapshot.queryParams['code'];
            console.log('code : ' + this.code);
            if(this.code != null ){
                this.pageLoading = true;
                this.patientLoading = true;
                this.coverageLoading = true;
                //localStorage.setItem('currentUser', JSON.stringify({ username:'BBUser21826', token: this.code}));
                this.getToken(this.code);
            } else {
                /*
                var currentUserStr = localStorage.getItem('currentUser');
                var currentUser = JSON.parse(currentUserStr);
                if(currentUser == null || currentUser.token == null || currentUser.token === undefined){
                    localStorage.removeItem('currentUser');
                }
                console.log('*** currentUserStr : ' + currentUserStr);
                if(currentUser != null){
                    var userObj = JSON.parse(currentUserStr);
                    console.log('got user token from local storage');
                } else {
                    console.log('getting token now *** ');
                    this.authenticationService.authorizeWithBlueButton().subscribe(data => {
                        console.log('inside block for retrieving token');
                        console.log('data : ' + data);
                        // this.getToken();
                    });
                } */
                this.showAuthLink = true;
            }    
        } else {
            this.pageLoading = true;
            this.patientLoading = true; 
            this.coverageLoading = true;           
            this.getClaimsData();
        }


        //this.authenticationService.getBlueButtonToken('BBUser00000', 'PW00000!', this.code, this.router);
        
    }

    getToken(code : string){
        var username = 'BBUser21826';
        this.authenticationService.getBlueButtonToken(code)
            .subscribe(data => this.saveToken(data, username));        
    }

    saveToken(data : any, username : any){
        if(data.access_token == null || data.access_token == undefined){
            localStorage.removeItem('currentUser');
        } else {
            localStorage.setItem('currentUser', JSON.stringify({ username, token: data.access_token}));
            this.getClaimsData();
        }
    }

    getClaimsData(){
        this.totalCountSubject.next(0);
        localStorage.setItem('eobJSONData', null);
        this.getEOB(null);
        this.claimListLoading = true; 
    }

    getEOB(url : string){

        if(url == null){
            this.authenticationService.getEOBJSON(0).subscribe(data => this.saveEOB(data));
        } else {
            this.authenticationService.getEOBData(url).subscribe(data => this.saveEOB(data))
        ;
        }
    }

    saveEOB(eobReturneddata){
        localStorage.setItem('eobJSONData', JSON.stringify(eobReturneddata));
        //this.userService.retrieveFHIRData();
        this.userService.getAll().pipe().subscribe(eobsArray => this.setClaims(eobsArray));           
    }    

    setClaims(eobsArray : EOB[]){
        this.eobClaims = [];
        var url = '';
        if(eobsArray){
            this.eobsArray = eobsArray;

            var len = eobsArray.length;
            for ( var i = 0 ; i < len; i ++){
                if(i==0){
                    this.getPatient(eobsArray[i].beneId);
                    this.getCoverage(eobsArray[i].beneId);
                }
                this.eobClaims = this.eobClaims.concat(eobsArray[i].claims);
                this.totalCountSubject.next(eobsArray[i].claimCount);                
            }

            if(this.eobClaims && this.eobClaims.length > 0){                
                this.claimIndex = 0;
                this.setSelectedClaim(this.claimIndex);
                this.showingIndex = this.claimIndex + 1;
                if(this.eobsArray){
                    let urlParams = new URLSearchParams(this.eobsArray[0].selfClaimStartURL);
                    let myParam = urlParams.get('startIndex');
                    this.showingIndex = parseInt(myParam);
                }
                
            }
            // get claim data
            url = this.selectedClaim.claimUrl;
            this.authenticationService.getClaimByURL(url).subscribe(data => this.saveClaimData(data));                        
        }
        this.claimListLoading = false;
        this.pageLoading = false;
    }

    getPatient(patientId : string){
        this.authenticationService.getPatientById(patientId)
            .subscribe(data => this.setPatient(data, patientId));
    }

    setPatient(data:any, patientId:string){
        this.patient = new Patient();
        this.patient.birthDate =  this.getNestedObject(data, ['birthDate']);
        this.patient.gender =  this.getNestedObject(data, ['gender']);
        this.patient.firstName =  this.getNestedObject(data, ['name', 0, 'given', 0, ]);
        this.patient.middleInitial =  this.getNestedObject(data, ['name', 0, 'given', 1, ]);
        this.patient.lastName =  this.getNestedObject(data, ['name', 0, 'family']);
        this.patient.race = this.getNestedObject(data, ['extension', 0, 'valueCoding', 'display']);
        this.patient.id = parseInt(patientId);
        var address = new Address();
        address.district = this.getNestedObject(data, ['address', 0, 'district']);
        address.state = this.getNestedObject(data, ['address', 0, 'state']);
        address.postalCode = this.getNestedObject(data, ['address', 0, 'postalCode']);
        this.patient.address = address; 
        this.patientLoading = false;
    }

    getCoverage(patientId : string){
        this.authenticationService.getCoverageByPatientId(patientId)
            .subscribe(data => this.setCoverage(data, patientId));
    }

    setCoverage(data : any, patientId : string){
        if(data){
            this.coverage = [];
            var total = this.getNestedObject(data, ['total']);
            for(var i = 0 ; i < total; i++){
                var cvg = new Coverage();            
                cvg.id = this.getNestedObject(data, ['entry', i, 'resource', 'id']);
                cvg.status = this.getNestedObject(data, ['entry', i, 'resource', 'status']);
                var cvgGrp = new CoverageGroup();
                cvgGrp.subgroup = this.getNestedObject(data, ['entry', i, 'resource', 'grouping', 'subGroup']);
                cvgGrp.subplan = this.getNestedObject(data, ['entry', i, 'resource', 'grouping', 'subPlan']);
                cvg.groups = [];
                cvg.groups.push(cvgGrp);
    
                /*
                cvg.period = ;
                
                */
                this.coverage.push(cvg);
            }
            this.coverageSubject.next(this.coverage);
        }
        this.coverageLoading = false;
    }

    saveClaimData(data : any) {
        console.log('claim data obtained');
    }

    isPrevious(){
        if(this.eobsArray){
            return (this.eobsArray[0] != null && this.eobsArray[0].prevClaimStartURL != null);
        }
        return false;
    }

    isNext(){
        if(this.eobsArray){
            return (this.eobsArray[0] != null && this.eobsArray[0].nextClaimStartURL != null);
        }
        return false;        
    }

    viewClaim(claimRecord : Claim){
        this.selectedClaim = claimRecord;
        localStorage.setItem('claim', JSON.stringify(this.selectedClaim)); 
    }

    nextClaim(){
        console.log('Next Claim : ' + this.claimIndex);
        if(this.claimIndex >= 0 && this.claimIndex < 9){
            this.claimIndex = this.claimIndex+1;
            this.setSelectedClaim(this.claimIndex);
        } else if (this.claimIndex == 0 && this.eobsArray[0].nextClaimStartURL){
            this.previousClaimSet();
        } else if (this.claimIndex >= 9 && this.eobsArray[0].nextClaimStartURL){
            this.nextClaimSet();
        }
    }

    nextClaimSet(){
        if(this.isNext()){
            this.claimListLoading = true;
            this.getEOB(this.eobsArray[0].nextClaimStartURL);
        }
    }

    previousClaim(){
        if(this.claimIndex > 0 && this.claimIndex < 9){
            this.claimIndex = this.claimIndex - 1;
            this.setSelectedClaim(this.claimIndex);
        } else if (this.claimIndex == 0 && this.isPrevious()){
            this.previousClaimSet();
        } else if (this.claimIndex >= 9 && this.isNext()){
            this.nextClaimSet();
        }        
    }

    previousClaimSet(){
        if(this.isPrevious()){
            this.claimListLoading = true;
            this.getEOB(this.eobsArray[0].prevClaimStartURL);
        }
    }

    setSelectedClaim(index: number){
        if(this.eobClaims){
            this.selectedClaim = this.eobClaims[index];
            localStorage.setItem('claim', JSON.stringify(this.selectedClaim));            
        }
    }

    processUserInvocations(){
        this.userService.retrieveFHIRData();

        this.userService.getAll().pipe().subscribe(eobsArray => { 
            this.eobsArray = eobsArray; 
        });
    }

    getNestedObject (nestedObj, pathArr)  {
        return pathArr.reduce((obj, key) => 
          (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
    }    
}