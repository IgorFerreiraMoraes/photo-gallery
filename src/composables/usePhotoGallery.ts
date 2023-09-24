import { ref, onMounted, watch } from 'vue';
import { isPlatform } from '@ionic/vue';
import { Capacitor } from '@capacitor/core';
import {
	Camera,
	CameraResultType,
	CameraSource,
	Photo,
} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const convert_blob_to_base_64 = (blob: Blob) =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onload = () => {
			resolve(reader.result);
		};
		reader.readAsDataURL(blob);
	});
const save_picture = async (
	photo: Photo,
	fileName: string
): Promise<UserPhoto> => {
	let base64Data: string | Blob;
	// "hybrid" will detect mobile - iOS or Android
	if (isPlatform('hybrid')) {
		const file = await Filesystem.readFile({
			path: photo.path!,
		});
		base64Data = file.data;
	} else {
		// Fetch the photo, read as a blob, then convert to base64 format
		const response = await fetch(photo.webPath!);
		const blob = await response.blob();
		base64Data = (await convert_blob_to_base_64(blob)) as string;
	}
	const savedFile = await Filesystem.writeFile({
		path: fileName,
		data: base64Data,
		directory: Directory.Data,
	});

	if (isPlatform('hybrid')) {
		// Display the new image by rewriting the 'file://' path to HTTP
		// Details: https://ionicframework.com/docs/building/webview#file-protocol
		return {
			filepath: savedFile.uri,
			webviewPath: Capacitor.convertFileSrc(savedFile.uri),
		};
	} else {
		// Use webPath to display the new image instead of base64 since it's
		// already loaded into memory
		return {
			filepath: fileName,
			webviewPath: photo.webPath,
		};
	}
};
export const use_photo_gallery = () => {
	const photos = ref<UserPhoto[]>([]);
	const PHOTO_STORAGE = 'photos';
	const cache_photos = () => {
		Preferences.set({
			key: PHOTO_STORAGE,
			value: JSON.stringify(photos.value),
		});
	};

	watch(photos, cache_photos);

	const load_saved = async () => {
		const photo_list = await Preferences.get({ key: PHOTO_STORAGE });
		const photos_in_preferences = photo_list.value
			? JSON.parse(photo_list.value)
			: [];

		if (!isPlatform('hybrid')) {
			for (const photo of photos_in_preferences) {
				const file = await Filesystem.readFile({
					path: photo.filepath,
					directory: Directory.Data,
				});
				photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
			}
		}
		photos.value = photos_in_preferences;
	};

	const take_photo = async () => {
		const photo = await Camera.getPhoto({
			resultType: CameraResultType.Uri,
			source: CameraSource.Camera,
			quality: 100,
		});
		const file_name = Date.now + '.jpeg';
		const saved_file_image = await save_picture(photo, file_name);
		photos.value = [saved_file_image, ...photos.value];
	};

	onMounted(load_saved);

	return {
		photos,
		take_photo,
	};
};

export interface UserPhoto {
	filepath: string;
	webviewPath?: string;
}
