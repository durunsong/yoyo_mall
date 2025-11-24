# 🔒 清理 Git 历史中的敏感信息

## ⚠️ 重要提醒

**本仓库的 Git 历史中包含已泄露的阿里云 AccessKey,需要清理历史记录!**

已泄露的 AccessKey: `LTAI5t5xAMmPtdEjHqGx9h5W`

## 立即行动清单

### ✅ 第一步: 禁用泄露的密钥 (最优先!)

**请立即登录阿里云控制台禁用该 AccessKey:**

1. 访问 [阿里云 RAM 控制台](https://ram.console.aliyun.com/users)
2. 找到用户 `durunsong`  
3. 禁用并删除 AccessKey: `LTAI5t5xAMmPtdEjHqGx9h5W`
4. 生成新的 AccessKey 并更新到本地 `.env.local` 文件

### ✅ 第二步: 清理 Git 历史记录

检测到以下提交包含敏感信息:
- `0bead4f` - 修改商城名称
- `e90ecf1` - 同步一个env

#### 推荐方案: 使用 BFG Repo-Cleaner

BFG 是专门用于清理 Git 历史的工具,比 git-filter-branch 快 10-720 倍。

**步骤:**

1. 下载 BFG (需要 Java 环境):
   ```bash
   # 访问 https://rtyley.github.io/bfg-repo-cleaner/
   # 下载 bfg-1.14.0.jar
   ```

2. 创建密钥替换文件 `passwords.txt`:
   ```
   LTAI5t5xAMmPtdEjHqGx9h5W
   M3Tii8l9acudWgtQkOVJ23V3UDj6sZ
   re_BfZdEMtp_G6oxMvGaC1f3k1sNSszEifkY
   FpaRmb1EM7jV
   ```

3. 执行清理:
   ```bash
   # 克隆镜像仓库
   git clone --mirror https://github.com/durunsong/yoyo_mall.git yoyo_mall-mirror
   cd yoyo_mall-mirror
   
   # 使用 BFG 替换敏感信息
   java -jar bfg-1.14.0.jar --replace-text passwords.txt
   
   # 清理并压缩
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # 强制推送 (会重写历史!)
   git push --force
   ```

#### 备选方案: 删除历史重新开始

如果不想使用 BFG,可以选择删除所有历史,从当前状态重新开始:

```bash
# 1. 删除 .git 目录
rm -rf .git

# 2. 重新初始化
git init
git add .
git commit -m "chore: 重新初始化仓库(已清理敏感信息)"

# 3. 强制推送
git remote add origin https://github.com/durunsong/yoyo_mall.git
git push -u --force origin main
```

### ✅ 第三步: 验证清理结果

```bash
# 搜索泄露的密钥
git log --all -p | grep "LTAI5t5xAMmPtdEjHqGx9h5W"

# 应该没有任何输出
```

### ✅ 第四步: 通知协作者

如果有其他人 clone 了这个仓库:

```bash
# 删除本地仓库
rm -rf yoyo_mall

# 重新克隆
git clone https://github.com/durunsong/yoyo_mall.git
```

## 安全检查清单

- [ ] 已禁用泄露的 AccessKey
- [ ] 已生成新的 AccessKey  
- [ ] 已清理 Git 历史
- [ ] 已验证清理结果
- [ ] 已通知协作者
- [ ] 启用 GitHub Secret Scanning
- [ ] 配置 pre-commit hooks

## 参考资源

- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [GitHub: 删除敏感数据](https://docs.github.com/zh/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [阿里云 AccessKey 泄露处理](https://help.aliyun.com/document_detail/142291.html)
