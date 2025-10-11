#!/usr/bin/env python3
import webbrowser
import requests
import time


def main():
    # 第一步：打开CGC
    # home_url = "http://localhost:8000/home/"
    # print(f"正在打开主页：{home_url}")
    # webbrowser.open(home_url)
    #
    # time.sleep(3)

    # 第二步：进入 endpoint 页面
    api_url = "http://10.0.49.158:5004/api/v1/admin/endpoints?endpoint_name=&page_num=1&page_size=10"
    headers = {'token': 'eyJhbGciOiJIUzUxMiIsImlhdCI6MTc2MDAwOTA5OCwiZXhwIjoxNzYxODIzNDk4fQ.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InlvbmdqaWFuLmRhaSJ9.jxsAefu1Xmi63wr3o026HMuV5l_MFHdlDBbvik8Pa5WDOYt_ioViKUnaBx231ja6DS5K-Fi11Cjl8dddhYzQ1w'}

    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        print("进入 endpoint 页面成功！")
    except requests.RequestException as e:
        print(f"进入 endpoint 页面失败：{e}")

    # 第三步： 同步schema
    sync_url = 'http://10.0.49.158:5004/api/v1/admin/endpoints/sync/demo'
    try:
        response = requests.get(sync_url, headers=headers, timeout=10)
        response.raise_for_status()
        print("同步schema成功！")
    except requests.RequestException as e:
        print(f"同步schema失败：{e}")

if __name__ == "__main__":
    main()
