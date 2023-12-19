// 各難度別のマップ
var dataMap;
// 難易度未決データリスト
var unClassedData;

/**
 * 初期表示処理
 */
function init(){
	// 難易度別マップをローカルストレージから取得
	dataMap = localStorage.getItem("dataMap");
	// 難易度未決データリストをローカルストレージから取得
	unClassedData = localStorage.getItem("unClassedData");
	// 取得できなかった場合
	if(!dataMap && !unClassedData){
		// 難易度別マップの初期化
		dataMap = {};
		// 難易度未決データリストを初期化
		unClassedData = new Array();
		// 曲データを難易度に振り分け
		for(let i = 0; i < difficultyData.length; i++){
			// 要素取得
			const data = difficultyData[i];
			// 難易度未決
			if(data.DIF == ""){
				// 未決データへの追加
				unClassedData.push(data);
			// それ以外
			}else{
				// マップ初期化
			 	if(!dataMap[data.DIF]){
			 		dataMap[data.DIF] = new Array();
			 	}
			 	// 特定難易度への振り分け
				dataMap[data.DIF].push(data);
			}
		}
		// ローカルストレージに保存
		save();
	// 取得できた場合
	}else{
		// 各々JSON文字列で退避されているため、デシリアライズする
		if(dataMap){
			dataMap = JSON.parse(dataMap);
		}
		if(unClassedData){
			unClassedData = JSON.parse(unClassedData);
		}
	}
	// 各難易度の詳細表示領域取得
	const rArea = document.getElementById("rArea");
	// 難易度別マップをループ
	for(let dif in dataMap){
		// 難易度セル作成
		const dv = document.createElement("div");
		// ドラッグ開始時イベント追加
		dv.ondragover = dragoverHandler;
		// ドロップイベント追加
		dv.ondrop = (evt) => {
			// デフォルト動作の抑制
			evt.preventDefault();
			// ドラッグ元データ取得
			const data = JSON.parse(event.dataTransfer.getData("text/plain"));
			// 難易度未決データの場合
			if(data.DIF == ""){
				// 未決データリストから該当データを削除
				for(let i = 0; i < unClassedData.length; i++){
					if(unClassedData[i].TITLE == data.TITLE && unClassedData[i].SCORE == data.SCORE){
						unClassedData.splice(i, 1);
						break;
					}
				}
				// 未決データの表示更新
				setUnclassedData();
				// ドラッグ元データの難易度をドロップ先に変更
				data.DIF = evt.target.innerText;
				// 難易度別マップに追加
				dataMap[evt.target.innerText].push(data);
				// 選択済の難易度へ追加された場合
				if(evt.target.classList.contains("active")){
					// クリックイベントを発生（これにより左表示領域をリロード）
					evt.target.click();
				}
			// 難易度付与済のデータの場合
			}else{
				// 付与されている難易度を取得
				const dif = data.DIF;
				// 難易度マップから該当データを取得
				const mList = dataMap[dif];
				// 対応するデータを削除
				for(let i = 0; i < mList.length; i++){
					if(mList[i].TITLE == data.TITLE && mList[i].SCORE == data.SCORE){
						mList.splice(i, 1);
						break;
					}
				}
				// 難易度マップの内容を更新（多分冗長だが念のため）
				dataMap[dif] = mList;
				// ドラッグ元のデータの難易度の書き換え
				data.DIF = evt.target.innerText;
				// ドロップ先の難易度のマップに追加
				dataMap[evt.target.innerText].push(data);
				// 左表示領域をリロード
				reloadR();
			}
		}
		// クラス追加
		dv.classList.add("dif");
		// 表記設定
		dv.innerText = dif;
		// クリックイベント追加
		dv.onclick = (evt) => {
			// 右表示領域にある難易度表記を取得
			const dList = document.getElementById("rArea").getElementsByTagName("div");
			// アクティブ状態を解除
			for(let i = 0; i < dList.length; i++){
				dList[i].classList.remove("active");
			}
			// クリックされた行をアクティブにする
			evt.target.classList.add("active");
			// クリックされた難易度を取得
			const dif = evt.target.innerText;
			// タイトルの書き換え
			document.getElementById("lTitle").innerText = dif;
			// 左表示領域を取得
			const lArea = document.getElementById("lArea");
			// 出力内容のクリア
			lArea.innerHTML = null;
			// 難易度別マップからクリックされた難易度の曲リストを取得
			const mList = dataMap[evt.target.innerText];
			
			mList.sort(dataSort);
			// 曲リストループ
			for(let i = 0; i < mList.length; i++){
				// セル作成
				const dv = document.createElement("div");
				dv.style = "display:flex;justify-content:space-between;";
				// 属性などを設定
				dv.setAttribute("draggable", true);
				dv.setAttribute("title", mList[i].TITLE);
				dv.setAttribute("score", mList[i].SCORE);
				// CSS用クラス設定
				dv.classList.add("music");
				dv.classList.add(mList[i].SCORE);
				// テキスト設定
				dv.innerHTML = "<div>" + mList[i].TITLE + "</div><div style='margin-right:0.5em;'>" + mList[i].SCORE + "</div>";
				// ドラックイベント追加
				dv.ondragstart = (evt) =>{
					// ドラッグ開始時の挙動設定
				    evt.dataTransfer.effectAllowed = "move";
				    // ドラッグ元データをdataTransferに設定
				    // ※JSONをserializeして文字列化する
					evt.dataTransfer.setData("text/plain", 
						JSON.stringify({
							DIF:dif,
							TITLE:evt.target.getAttribute("title"),
							SCORE:evt.target.getAttribute("score")
						})
					);
				}
				// 左表示領域に曲を追加
				lArea.appendChild(dv);
			}
		}
		// 右表示領域に追加
		rArea.appendChild(dv);
	}
	// 未決リストの描画
	setUnclassedData();
	// 先頭をクリックする
	document.getElementById("rArea").getElementsByTagName("div")[0].click();
}
function dataSort(a, b) {
	if(a.TITLE.toUpperCase() < b.TITLE.toUpperCase()){
		return -1;
	}else if(a.TITLE.toUpperCase() > b.TITLE.toUpperCase()){
		return 1;
	}
	const scoreSortMap = {
		HYPER:0,
		ANOTHER:1,
		LEGGENDARIA:2
	};
	return scoreSortMap[a.SCORE] - scoreSortMap[b.SCORE];
}
/**
 * 未決リスト描画
 */
function setUnclassedData(){
	// 中央エリアの表示領域取得
	const mArea = document.getElementById("mArea");
	// 表示内容をクリア
	mArea.innerHTML = null;
	unClassedData.sort(dataSort);
	// 未決リストループ
	for(let i = 0; i < unClassedData.length; i++){
		// セル作成
		const dv = document.createElement("div");
		dv.style = "display:flex;justify-content:space-between;";
		// 属性などを設定
		dv.setAttribute("draggable", true);
		dv.setAttribute("title", unClassedData[i].TITLE);
		dv.setAttribute("score", unClassedData[i].SCORE);
		// CSS用クラス設定
		dv.classList.add("music");
		dv.classList.add(unClassedData[i].SCORE);
		// 表記設定
		dv.innerHTML = "<div>" + unClassedData[i].TITLE + "</div><div style='margin-right:0.5em;'>" + unClassedData[i].SCORE + "</div>";
		// ドラッグ開始時イベント追加
		dv.ondragstart = (evt) =>{
			// ドラッグ開始時の挙動設定
		    evt.dataTransfer.effectAllowed = "move";
		    // ドラッグ元データをdataTransferに設定
		    // ※JSONをserializeして文字列化する
			evt.dataTransfer.setData("text/plain", 
				JSON.stringify({
					DIF:"",
					TITLE:evt.target.getAttribute("title"),
					SCORE:evt.target.getAttribute("score")
				})
			);
		}
		// 中央表示領域へ追加
		mArea.appendChild(dv);
	}
}
/**
 * 右表示領域をリロード
 */
function reloadR(){
	// 左表示領域取得
	const rArea = document.getElementById("rArea");
	// 難易度別リスト取得
	const rList = rArea.getElementsByTagName("div");
	// リストループ
	for(let i = 0; i < rList.length; i++){
		// アクティブなセルの場合
		if(rList[i].classList.contains("active")){
			// クリック→左表示領域がリセットされる
			rList[i].click();
		}
	}
}
/**
 * ドラッグ中イベント
 * ※evetn.preventDefault用
 */
function dragoverHandler(){
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";
}
/**
 * 未決リスト領域へのドロップ時のイベント
 */
function dropUnclassedHandler(){
	// デフォルト挙動を抑制
	event.preventDefault();
	// ドラッグ元データの取得
	const data = JSON.parse(event.dataTransfer.getData("text/plain"));
	// 未決データでない場合　※未決→未決については何もしない
	if(data.DIF != ""){
		// ドラッグ元データの難易度を取得
		const dif = data.DIF;
		// マップから対応する曲リストを取得
		const mList = dataMap[dif];
		// リストループ
		for(let i = 0; i < mList.length; i++){
			// 対応するデータの場合
			if(mList[i].TITLE == data.TITLE && mList[i].SCORE == data.SCORE){
				// 削除
				mList.splice(i, 1);
				// 以後処理不要
				break;
			}
		}
		// 難易度マップの更新
		dataMap[dif] = mList;
		// ドラッグ元データの難易度を未決にする
		data.DIF = "";
		// 未決データリストに追加
		unClassedData.push(data);
		// 未決表示の再描画
		setUnclassedData();
		// 左表示領域の更新
		reloadR();
	}
}
/**
 * 左表示領域へのドロップ時のイベント
 */
function dropClassedHandler(){
	// ドラッグ元データ取得
	const data = JSON.parse(event.dataTransfer.getData("text/plain"));
	// 未決データからのドラッグ＆ドロップ
	// ※各難易度からのドロップについては何もする必要なし
	if(data.DIF == ""){
		// 未決データからドラッグされたデータを削除
		for(let i = 0; i < unClassedData.length; i++){
			if(unClassedData[i].TITLE == data.TITLE && unClassedData[i].SCORE == data.SCORE){
				unClassedData.splice(i, 1);
				break;
			}
		}
		// 未決データの表示更新
		setUnclassedData();
		
		const dif = document.getElementById("lTitle").innerText;
		// ドロップ先の難易度に変更
		data.DIF = dif;
		// 難易度表マップへ追加
		dataMap[dif].push(data);
		// 左表示領域のリロード
		reloadR();
	}
}
/**
 * ローカルストレージに保存
 */
function save(){
	// 難易度別マップをローカルストレージに保存
	localStorage.setItem("dataMap", JSON.stringify(dataMap));
	// 難易度未決リストをローカルストレージに保存
	localStorage.setItem("unClassedData", JSON.stringify(unClassedData));
}