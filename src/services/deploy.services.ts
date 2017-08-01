import { Injectable } from '@angular/core';
import { Platform, AlertController } from "ionic-angular";
import { Deploy } from '@ionic/cloud-angular';

import { Config } from '../config/config';

/*
  Generated class for the ApiCall provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class DeployService {

	public deploy: Deploy; 
	constructor(platform: Platform, public alertCtrl: AlertController) {
		platform.ready().then(() => {

			// checking if deploy feature is there
			if (Config.ENV != "DEV") {
				console.log("1.0.0");

				//setting channel
				if (Config.ENV == "NIGHTLY") {
					this.deploy.channel = "nightly";
				} else if (Config.ENV == "STAGING") {
					this.deploy.channel = "staging";
				} else if (Config.ENV == "PRODUCTION") {
					this.deploy.channel = "production";
				} else {
					this.deploy.channel = "nightly";
				}

				// deleting older snapshots
				this.deploy.getSnapshots().then((snapshots) => {
					console.log(snapshots);
					for (let snapshot of snapshots) {
						console.log("snapshot : " + snapshot);
						this.deploy.info().then(function (deployInfo) {
							console.log("current snapshot : " + JSON.stringify(deployInfo));
							console.log("deployInfo.deploy_uuid",deployInfo.deploy_uuid);
							console.log("snapshot",snapshot);
							
							if (snapshot != deployInfo.deploy_uuid) {
								console.log("Deleting snapshot : " + snapshot);
								this.deploy.deleteSnapshot(snapshot).then((data) => {
									console.log("deletion successful : " + JSON.stringify(data));
								}).error((err) => {
									console.log("deletion failed : " + JSON.stringify(err));
								});
							}
						});
					}
				});

				// checking for new build
				this.deploy.check().then((snapshotAvailable: boolean) => {

					console.log("Snapshot available :" + snapshotAvailable);
					if (snapshotAvailable) {
						this.deploy.getMetadata().then((metadata) => {

							console.log("Is deploy :  " + metadata.deploy);
							// if deploy flag is true then only proceed
							if (metadata.deploy) {
								if (metadata.force) {
									this.showAgreeAlert();
								} else {
									this.showConfirmationAlert();
								}
							}
						});
					}
				});

			} else {
				console.log("Deploy feature not available for dev build.")
			}
		});
	}

	// forcing user to update
	showAgreeAlert() {
		let confirm = this.alertCtrl.create({
			title: 'Update available',
			message: 'Click Ok to update the app.',
			buttons: [
				{
					text: 'Agree',
					handler: () => {
						console.log('Agree clicked');
						this.deployNewVersion();
					}
				}
			]
		});
		confirm.present();
	}

	// asking user for update
	showConfirmationAlert() {
		let confirm = this.alertCtrl.create({
			title: 'Update available',
			message: 'Do you want to update your app now?',
			buttons: [
				{
					text: 'Disagree',
					handler: () => {
						console.log('Disagree clicked');
					}
				},
				{
					text: 'Agree',
					handler: () => {
						console.log('Agree clicked');
						this.deployNewVersion();
					}
				}
			]
		});
		confirm.present();
	}

	// deploying new build
	deployNewVersion() {
		this.deploy.download().then(() => {
			console.log("dowloaded");
			this.deploy.extract().then(() => {
				this.deploy.load();
			});
		});
	}

}
