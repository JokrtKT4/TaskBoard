import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { ApiResponse } from 'src/app/Class/Common/ApiResponse';
import { UserInfo } from 'src/app/Class/Common/UserInfo';
import { DashboardService } from 'src/app/Services/Common/Dashboard.service';
import { ErrorDialogueService } from 'src/app/Services/Common/ErrorDiag.service';
import { TaskService } from 'src/app/Services/Task/Task.service';
import { Helper, MessageType } from 'src/environments/Helper';

@Component({
  selector: 'app-authoritydash',
  templateUrl: './authoritydash.component.html',
  styleUrls: ['./authoritydash.component.css']
})
export class AuthoritydashComponent implements OnInit {

  //#region Declaration
  public totalTask: number = 0;
  public DeveloperPending: number = 0;
  public YetToApprove: number = 0;
  public CompletedTask: number = 0;
  public InProgress: number = 0;
  public YetToStart: number = 0;
  public ratio: number = 0;

  public totalRoutineTask: number = 0;
  public totalRoutineTime: number = 0;

  public totalTime: number = 0;
  public pendingTime: number = 0;
  public actualTime: number = 0;

  public averageRating: number = 0;
  public totalRatedTask: number = 0;
  public totalRating: number = 0;

  public ddlReportType: string[] = ["In Progess", "Rating Pending", "Completed", "Routine"]
  public selectedReportType: string = "In Progess";

  public developerID: number = 0;
  public developerName: string;

  public tblTaskList: object[] = [];
  public tblUsers: object[] = [];
  public UserInfo: UserInfo;
  //#endregion

  constructor(private errorService: ErrorDialogueService,
    private spinnerService: NgxSpinnerService,
    private Service: DashboardService,
    private taskService: TaskService,
    private toastr: ToastrService,
    private helper: Helper) { }

  async ngOnInit() {
    this.UserInfo = JSON.parse(sessionStorage.getItem("UserInfo"));
    await this.GetData();
  }

  //#region API Methods  
  private async GetData() {
    try {
      this.spinnerService.show();
      let paraList = {
        Type: 'GetData',
        Role: this.UserInfo.role,
        UserId: this.UserInfo.userId
      }
      let response: ApiResponse = await this.Service.Data(paraList);
      if (response.isValidUser) {
        if (response.messageType == MessageType.success) {
          this.tblUsers = response.dataList['ds']['table'];
          if (response.dataList['ds']['table1'].length > 0) {            

            this.totalTime = this.helper.getDecimal(response.dataList['ds']['table1'][0]['approxHours']);
            this.pendingTime = this.helper.getDecimal(response.dataList['ds']['table1'][0]['pendingHours']);
            this.actualTime = this.helper.getDecimal(response.dataList['ds']['table1'][0]['spentHours']);
          }
          if (response.dataList['ds']['table2'].length > 0) {
            this.averageRating = this.helper.getDecimal(response.dataList['ds']['table2'][0]['average']);
            this.totalRatedTask = this.helper.getDecimal(response.dataList['ds']['table2'][0]['totalTask']);
            this.totalRating = this.helper.getDecimal(response.dataList['ds']['table2'][0]['totalRatings']);
          }
          else {
            this.averageRating = 0;
            this.totalRatedTask = 0;
            this.totalRating = 0;
          }
          if (response.dataList['ds']['table3'].length > 0) {
            this.totalRoutineTask = this.helper.getDecimal(response.dataList['ds']['table3'][0]['totalTask']);
            this.totalRoutineTime = this.helper.getDecimal(response.dataList['ds']['table3'][0]['totalTime']);
          }
          else {
            this.totalRoutineTask = 0;
            this.totalRoutineTime = 0;
          }
          if (response.dataList['ds']['table4'].length > 0) {
            this.DeveloperPending = this.helper.getDecimal(response.dataList['ds']['table4'][0]['developerPending']);
            this.totalTask = this.helper.getDecimal(response.dataList['ds']['table4'][0]['totalTasks']);
            this.YetToApprove = this.helper.getDecimal(response.dataList['ds']['table4'][0]['yetToApprove']);
          }
          if (response.dataList['ds']['table5'].length > 0) {
            this.ratio = this.helper.getDecimal(response.dataList['ds']['table5'][0]['ratio']);
            this.CompletedTask = this.helper.getDecimal(response.dataList['ds']['table5'][0]['completed']);
            this.InProgress = this.helper.getDecimal(response.dataList['ds']['table5'][0]['inProgress']);
            this.YetToStart = this.helper.getDecimal(response.dataList['ds']['table5'][0]['yetToStart']);
          }
        }
        else if (response.messageType == MessageType.error)
          this.toastr.error(response.message);
        else
          this.toastr.error('Something Went Wrong');
      }
      this.spinnerService.hide();
    }
    catch (error) {
      this.spinnerService.hide();
      this.errorService.error(error);
    }
  }
  public async GetTask() {
    try {
      this.spinnerService.show();
      let paraList = {
        Type: 'GetTask',
        ReportType: this.selectedReportType,
        UserId: this.developerID
      }
      let response: ApiResponse = await this.Service.Data(paraList);
      if (response.isValidUser) {
        if (response.messageType == MessageType.success) {
          this.tblTaskList = response.dataList['ds']['table'];
          this.tblTaskList.forEach(element => {
            element['devData'] = response.dataList['ds']['table1'].filter(f => f['taskId'] == element['id']);
            element['disableComplete'] = element['devData'].find(f => f['completeDate'] == null) == undefined ? false : true;
            if (response.dataList['ds']['table2'].length > 0) {
              let utMin: Object = response.dataList['ds']['table2'].filter(d => d['taskId'] == element['id'])[0];
              element['Progress'] = this.helper.getDecimal((utMin['usedMins'] * 100) / utMin['totalMins']).toFixed(2);
              element['TotalHours'] = this.helper.getDecimal(response.dataList['ds']['table2'].filter(f => f['taskId'] == element['id'])[0]['finalTotalHours']).toFixed(2);
              element['UtilizeHours'] = this.helper.getDecimal(response.dataList['ds']['table2'].filter(f => f['taskId'] == element['id'])[0]['utilizeHours']).toFixed(2);
              element['PendingHours'] = this.helper.getDecimal(response.dataList['ds']['table2'].filter(f => f['taskId'] == element['id'])[0]['finalPendingHours']).toFixed(2);
            }
            element['Files'] = [];
            if (this.helper.getStringOrEmpty(element['fileList']) != "") {
              element['fileList'].split("|").forEach(f => {
                element['Files'].push(f);
              });
            }
          });
        }
        else if (response.messageType == MessageType.error)
          this.toastr.error(response.message);
        else
          this.toastr.error('Something Went Wrong');
      }
      this.spinnerService.hide();
    }
    catch (error) {
      this.spinnerService.hide();
      this.errorService.error(error);
    }
  }
  public async DownloadFile(fileName: string) {
    try {
      this.spinnerService.show();
      await this.taskService.Download(fileName)
      this.spinnerService.hide();
    }
    catch (error) {
      this.spinnerService.hide();
      this.errorService.error(error);
    }
  }
  //#endregion

  //#region Other Methods
  public async DeveloperCardClick(data: object) {
    this.developerID = data['id'];
    this.developerName = data['fullName'];
    await this.GetTask();
  }
  public async CloseUser() {
    this.developerID = 0;
    this.developerName = null;
    this.tblTaskList = [];
    this.selectedReportType = "In Progess";
  }
  //#endregion
}
