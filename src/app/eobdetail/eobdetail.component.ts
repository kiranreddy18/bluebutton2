import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { User } from '../_models';
import { EOB } from '../_models';
import { Claim, Patient, Address } from '../_models';
import { ClaimService } from '../_models';
import { EOBDetail } from '../_models';
import { UserService } from '../_services';
import { AuthenticationService } from '../_services';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import {Params} from '@angular/router';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { getLocaleTimeFormat } from '@angular/common';

@Component({templateUrl: 'eobdetail.component.html'})
export class EOBDetailComponent implements OnInit {

    users: User[] = [];
    eobsArray =  [];
    eobDetailArray =  [];
    eobForm: FormGroup;
    loading = false;
    submitted = false;
    returnUrl: string;
    claimId: string;
    code: string;
    error = '';
    urlClaimId: string;
    claimIndex: number;
    names = [];
    
    selectedClaim : Claim;
    patient : Patient;
    patientSubject = new BehaviorSubject<Patient>(new Patient());
    claimSubject = new BehaviorSubject<Claim>(new Claim());
    claimData = this.claimSubject.asObservable();

    constructor(
      private formBuilder: FormBuilder,
      private route: ActivatedRoute,
      private userService: UserService,
      private authenticationService: AuthenticationService,
      private router: Router) {}

    ngOnInit() {
        let url = this.route.snapshot.url;
        let urlClaimId = url[1].path.slice(0,10);

        var strClaimInfo = localStorage.getItem('claim');
        this.selectedClaim = JSON.parse(strClaimInfo);

        /*
        this.userService.getEOBDetail().pipe().subscribe(eobDetailArray => { 
                this.eobDetailArray = eobDetailArray;
        });
        */

        this.getClaim(this.selectedClaim.claimUrl);
    }

    getClaim(url){
        this.authenticationService.getClaimByURL(url).subscribe(data => this.assignClaim(data))
    }

    assignClaim(data : any){
        if(data){
            var patientRef =  this.getNestedObject(data, ['patient', 'reference']) ;
            var patientId = patientRef.substr(patientRef.indexOf("/")+1);
            this.getPatient(patientId);

            var localClaim = new Claim();
            
            localClaim.billablePeriodStart = this.getNestedObject(data, ['billablePeriod', 'start']) ;
            localClaim.billablePeriodEnd = this.getNestedObject(data, ['billablePeriod', 'end']) ;     
            var localId = this.getNestedObject(data, ['id']) ;
            var index = localId.indexOf( "-" ); 
            localClaim.id = localId.substr(index + 1);
            localClaim.type = localId.substr(0,index);
            
            localClaim.typeCode = this.getNestedObject(data, ['type', 'coding', 0, 'code']) ;
            localClaim.typeCodeDisplay = this.getNestedObject(data, ['type', 'coding', 0, 'display']);
            localClaim.status = this.getNestedObject(data, ['status']);
            localClaim.primaryPayerAmount = this.getNestedObject(data, ['extension', 0, 'valueMoney', 'value']);
            localClaim.deductibleAmount = this.getNestedObject(data, ['extension', 5, 'valueMoney', 'value']);
            localClaim.providerPayAmount = this.getNestedObject(data, ['extension', 6, 'valueMoney', 'value']);
            localClaim.benePayment = this.getNestedObject(data, ['extension', 7, 'valueMoney', 'value']);
            localClaim.submittedCharges = this.getNestedObject(data, ['extension', 8, 'valueMoney', 'value']);
            localClaim.allowedAmount =  this.getNestedObject(data, ['extension', 9, 'valueMoney', 'value']);
            

            let claimServices = this.getNestedObject(data, ['item']);
            if(claimServices && claimServices.length > 0){
                localClaim.services = [];
                var serviceLen = claimServices.length;
                for(var j = 0 ; j < serviceLen; j++){
                    let serviceLine = new ClaimService();
                    serviceLine.quantity = this.getNestedObject(claimServices[j], ['quantity', 'value']);
                    serviceLine.sequence = this.getNestedObject(claimServices[j], ['sequence']);
                    serviceLine.servicePeriodStart = this.getNestedObject(claimServices[j], ['servicedPeriod', 'start']);
                    serviceLine.servicePeriodEnd = this.getNestedObject(claimServices[j], ['servicedPeriod', 'end']);
                    serviceLine.serviceCode = this.getNestedObject(claimServices[j], ['service', 'coding', 0, 'code']);
                    serviceLine.categoryCode = this.getNestedObject(claimServices[j], ['category', 'coding', 0, 'code']);
                    serviceLine.categoryDisplay = this.getNestedObject(claimServices[j], ['category', 'coding', 0, 'display']);
                    localClaim.services.push(serviceLine);
                }
            }

            //this.claimSubject.next(localClaim);

        }
    }

    getPatient(patientId : string){
        var url = "https://sandbox.bluebutton.cms.gov/v1/fhir/Patient/" + patientId;
        this.authenticationService.getPatient(url).subscribe(data => this.setPatient(data, patientId));        
    }

    setPatient(data : any, patientId: string){
        if(data){
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

            this.patientSubject.next(this.patient);

            console.log('patient id : ' + this.patient.id);
            console.log('patient firstName : ' + this.patient.firstName);
        }
    }

    formatEOBDetail (eobDetail: EOBDetail, eobClaimEntry: any)  {
        // status     
        eobDetail.claimStatus = this.getNestedObject(eobClaimEntry, ['resource', 'status']) ;
        //billable period - start         
        eobDetail.billablePeriodStart = this.getNestedObject(eobClaimEntry, ['resource', 'billablePeriod', 'start']) ;
      
        //billable period - end           
        eobDetail.billablePeriodEnd = this.getNestedObject(eobClaimEntry, ['resource', 'billablePeriod', 'end']) ;

        // claim id and type (i.e. carrier)                      
        this.claimId = this.getNestedObject(eobClaimEntry, ['resource', 'id']) ;
        var index = this.claimId.indexOf( "-" ); 
        eobDetail.claimId = this.claimId.substr(index + 1,10);
        eobDetail.claimType = this.claimId.substr(0,index);
              
        // claim_type_cd and claim_type_cd display                    
        eobDetail.claimTypeCd = this.getNestedObject(eobClaimEntry, ['resource', 'type', 'coding', 0, 'code']) ;          
        eobDetail.claimTypeCdDisplay = this.getNestedObject(eobClaimEntry, ['resource', 'type', 'coding', 0, 'display']) ;
        return eobDetail;
      
    }

    getNestedObject (nestedObj, pathArr)  {
        return pathArr.reduce((obj, key) => 
          (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
    }
  
}